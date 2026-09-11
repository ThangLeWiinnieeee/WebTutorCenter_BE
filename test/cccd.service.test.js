const test = require("node:test");
const assert = require("node:assert/strict");

process.env.CCCD_RECEIPT_SECRET = "test-cccd-receipt-secret";
const {
  createVerificationReceipt,
  consumeVerificationReceipt,
  signedAssetUrl,
} = require("../src/services/cccd.service");
const cloudinary = require("../src/configs/cloudinary");
const cccdRouter = require("../src/routes/cccd.routes");
const { CCCD_UPLOAD_LIMITS, hasValidImageSignature } = cccdRouter;
const { cccdRateLimiter } = require("../src/middlewares/rateLimit.middleware");
const { extractCloudinaryAsset } = require("../src/utils/upload");

test("biên nhận CCCD chỉ dùng được cho đúng user và đúng hai ảnh đã quét", () => {
  const verification = {
    decision: "pass",
    reasons: [],
    modelVersion: "test-model",
    checks: { frontOcrConfidence: 0.9, backOcrConfidence: 0.8, qrDecoded: true },
  };
  const receipt = createVerificationReceipt({
    userId: "user-1",
    frontUrl: "https://example.com/front.jpg",
    backUrl: "https://example.com/back.jpg",
    verification,
  });

  const summary = consumeVerificationReceipt(
    receipt,
    "user-1",
    "https://example.com/front.jpg",
    "https://example.com/back.jpg"
  );
  assert.equal(summary.decision, "pass");
  assert.equal(summary.qrDecoded, true);
  assert.throws(
    () =>
      consumeVerificationReceipt(
        receipt,
        "user-2",
        "https://example.com/front.jpg",
        "https://example.com/back.jpg"
      ),
    /quét lại CCCD/i
  );
});

test("upload CCCD kiểm tra chữ ký nội dung thay vì chỉ tin MIME từ client", () => {
  assert.equal(
    hasValidImageSignature({
      mimetype: "image/jpeg",
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0x00]),
    }),
    true
  );
  assert.equal(
    hasValidImageSignature({
      mimetype: "image/png",
      buffer: Buffer.from("not-a-real-png"),
    }),
    false
  );
});

test("rate limit chạy trước Multer để request vượt quota không giữ ảnh vào RAM", () => {
  const verifyRoute = cccdRouter.stack.find((layer) => layer.route?.path === "/verify");
  assert.equal(verifyRoute.route.stack[1].handle, cccdRateLimiter);
});

test("multipart CCCD chỉ nhận đúng hai file và không nhận text field", () => {
  assert.deepEqual(CCCD_UPLOAD_LIMITS, {
    fileSize: 8 * 1024 * 1024,
    files: 2,
    fields: 0,
    parts: 2,
  });
});

test("parser Cloudinary nhận signed authenticated URL để purge đúng delivery type", () => {
  assert.deepEqual(
    extractCloudinaryAsset(
      "https://res.cloudinary.com/demo/image/authenticated/s--signature--/v123/webtutorcenter/documents/cccd_front_id.jpg?_a=x"
    ),
    {
      type: "authenticated",
      publicId: "webtutorcenter/documents/cccd_front_id",
    }
  );
  assert.deepEqual(
    extractCloudinaryAsset(
      "https://res.cloudinary.com/demo/image/upload/v123/webtutorcenter/avatars/avatar.jpg"
    ),
    { type: "upload", publicId: "webtutorcenter/avatars/avatar" }
  );
  assert.equal(
    extractCloudinaryAsset(
      "https://evil-cloudinary.com/image/upload/v123/webtutorcenter/documents/cccd_front_id.jpg"
    ),
    null
  );
});

test("CCCD authenticated tạo signed delivery URL giữ nguyên contract URL", () => {
  cloudinary.config({ cloud_name: "demo", api_key: "key", api_secret: "secret", secure: true });
  const url = signedAssetUrl({
    public_id: "webtutorcenter/documents/cccd_front_id",
    version: 123,
    format: "jpg",
  });

  assert.match(url, /^https:\/\/res\.cloudinary\.com\/demo\/image\/authenticated\/s--[^/]+--\/v123\//);
});

test("production từ chối khóa CCCD yếu hoặc dùng chung", () => {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    CCCD_URL: process.env.CCCD_URL,
    CCCD_INTERNAL_SECRET: process.env.CCCD_INTERNAL_SECRET,
    CCCD_RECEIPT_SECRET: process.env.CCCD_RECEIPT_SECRET,
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  };
  Object.assign(process.env, {
    NODE_ENV: "production",
    CCCD_URL: "https://cccd.example.com",
    CCCD_INTERNAL_SECRET: "a".repeat(32),
    CCCD_RECEIPT_SECRET: "a".repeat(32),
    ACCESS_TOKEN_SECRET: "access-secret-different",
  });

  try {
    assert.throws(
      () =>
        createVerificationReceipt({
          userId: "user-1",
          frontUrl: "https://example.com/front.jpg",
          backUrl: "https://example.com/back.jpg",
          verification: { decision: "pass", checks: {} },
        }),
      /cấu hình bảo mật/i
    );
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
