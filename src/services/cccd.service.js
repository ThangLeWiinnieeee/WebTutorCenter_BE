const { randomUUID } = require("node:crypto");
const jwt = require("jsonwebtoken");

const cloudinary = require("../configs/cloudinary");
const { CCCD_DECISION, CCCD_SUBMITTABLE_DECISIONS } = require("../constants/cccd");
const HTTP_STATUS = require("../constants/status");
const MESSAGE = require("../constants/message");
const userRepository = require("../repositories/user.repository");
const AppError = require("../utils/AppError");
const { createInternalClient } = require("../utils/serviceClient");

const CCCD_DELIVERY_TYPE = "authenticated";
const normalizeSecret = (value) => String(value || "").trim();
const weakSecret = (value) => {
  const secret = normalizeSecret(value);
  return secret.length < 32 || /^(change-me|your-|replace-with-)/i.test(secret);
};

const assertProductionConfig = () => {
  if (process.env.NODE_ENV !== "production") return;

  const internalSecret = normalizeSecret(process.env.CCCD_INTERNAL_SECRET);
  const receiptSigningSecret = normalizeSecret(process.env.CCCD_RECEIPT_SECRET);
  const accessSecret = normalizeSecret(process.env.ACCESS_TOKEN_SECRET);
  const refreshSecret = normalizeSecret(process.env.REFRESH_TOKEN_SECRET);
  const secretsAreReused =
    receiptSigningSecret === internalSecret ||
    receiptSigningSecret === accessSecret ||
    receiptSigningSecret === refreshSecret ||
    internalSecret === accessSecret ||
    internalSecret === refreshSecret;

  if (
    !String(process.env.CCCD_URL || "").trim() ||
    weakSecret(internalSecret) ||
    weakSecret(receiptSigningSecret) ||
    secretsAreReused
  ) {
    throw new AppError(MESSAGE.CCCD_CONFIG_MISSING, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }
};

assertProductionConfig();

const cccdClient = createInternalClient({
  baseURL: String(process.env.CCCD_URL || "http://localhost:8002").trim(),
  secret: normalizeSecret(process.env.CCCD_INTERNAL_SECRET),
  timeout: Number(process.env.CCCD_TIMEOUT_MS) || 60000,
  serviceLabel: "Dịch vụ quét CCCD",
});

const receiptSecret = () => {
  assertProductionConfig();
  const secret = normalizeSecret(
    process.env.CCCD_RECEIPT_SECRET ||
      (process.env.NODE_ENV !== "production" ? process.env.ACCESS_TOKEN_SECRET : "")
  );
  if (!secret) {
    throw new AppError(MESSAGE.CCCD_CONFIG_MISSING, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }
  return secret;
};

const verificationSummary = (verification) => ({
  decision: verification.decision,
  reasons: Array.isArray(verification.reasons) ? verification.reasons : [],
  modelVersion: verification.modelVersion || null,
  frontOcrConfidence: verification.checks?.frontOcrConfidence ?? 0,
  backOcrConfidence: verification.checks?.backOcrConfidence ?? 0,
  qrDecoded: Boolean(verification.checks?.qrDecoded),
  qrOcrMatch: verification.checks?.qrOcrMatch ?? null,
  profileMatch: verification.checks?.profileMatch ?? null,
});

const createVerificationReceipt = ({ userId, frontUrl, backUrl, verification }) =>
  jwt.sign(
    {
      purpose: "cccd_verification",
      frontUrl,
      backUrl,
      verification: verificationSummary(verification),
    },
    receiptSecret(),
    {
      algorithm: "HS256",
      subject: String(userId),
      expiresIn: process.env.CCCD_RECEIPT_EXPIRES_IN || "1h",
    }
  );

const consumeVerificationReceipt = (receipt, userId, frontUrl, backUrl) => {
  let decoded;
  try {
    decoded = jwt.verify(receipt, receiptSecret(), { algorithms: ["HS256"] });
  } catch (_error) {
    throw new AppError(MESSAGE.CCCD_RECEIPT_INVALID, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }

  const valid =
    decoded.purpose === "cccd_verification" &&
    decoded.sub === String(userId) &&
    decoded.frontUrl === frontUrl &&
    decoded.backUrl === backUrl &&
    CCCD_SUBMITTABLE_DECISIONS.includes(decoded.verification?.decision);
  if (!valid) {
    throw new AppError(MESSAGE.CCCD_RECEIPT_INVALID, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }

  return {
    ...decoded.verification,
    verifiedAt: new Date(decoded.iat * 1000),
  };
};

const appendClaimedIdentity = (form, user) => {
  if (user.fullName) form.append("claimed_full_name", user.fullName);
  if (user.dateOfBirth) {
    form.append("claimed_date_of_birth", new Date(user.dateOfBirth).toISOString().slice(0, 10));
  }
  if (["male", "female"].includes(user.gender)) form.append("claimed_gender", user.gender);
};

const scan = async (front, back, user) => {
  const form = new FormData();
  form.append("front", new Blob([front.buffer], { type: front.mimetype }), "front-image");
  form.append("back", new Blob([back.buffer], { type: back.mimetype }), "back-image");
  appendClaimedIdentity(form, user);

  const { data } = await cccdClient.post("/api/verify", form);
  if (!data?.decision || !data?.checks) {
    throw new AppError(MESSAGE.CCCD_RESPONSE_INVALID, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }
  return data;
};

const uploadDocument = (file, side) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "webtutorcenter/documents",
        public_id: `cccd_${side}_${randomUUID()}`,
        resource_type: "image",
        type: CCCD_DELIVERY_TYPE,
        transformation: [
          { width: 1600, height: 1600, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(file.buffer);
  });

const signedAssetUrl = (asset) =>
  cloudinary.url(asset.public_id, {
    resource_type: "image",
    type: CCCD_DELIVERY_TYPE,
    sign_url: true,
    secure: true,
    version: asset.version,
    format: asset.format,
  });

const destroyAsset = (asset) =>
  asset
    ? cloudinary.uploader.destroy(asset.public_id, {
        resource_type: "image",
        type: CCCD_DELIVERY_TYPE,
      })
    : Promise.resolve();

const verifyAndUpload = async (userId, front, back) => {
  assertProductionConfig();
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError(MESSAGE.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  const verification = await scan(front, back, user);
  if (verification.decision === CCCD_DECISION.RETAKE) {
    return { verification, cccdFrontImage: null, cccdBackImage: null, receipt: null };
  }
  if (!CCCD_SUBMITTABLE_DECISIONS.includes(verification.decision)) {
    throw new AppError(MESSAGE.CCCD_RESPONSE_INVALID, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }

  let frontAsset;
  let backAsset;
  try {
    frontAsset = await uploadDocument(front, "front");
    backAsset = await uploadDocument(back, "back");

    const cccdFrontImage = signedAssetUrl(frontAsset);
    const cccdBackImage = signedAssetUrl(backAsset);
    const receipt = createVerificationReceipt({
      userId,
      frontUrl: cccdFrontImage,
      backUrl: cccdBackImage,
      verification,
    });
    return { verification, cccdFrontImage, cccdBackImage, receipt };
  } catch (error) {
    await Promise.allSettled([destroyAsset(frontAsset), destroyAsset(backAsset)]);
    if (error instanceof AppError) throw error;
    console.error(
      `[cccd] Cloudinary secure upload failed: ${error?.http_code || error?.name || "unknown"}`
    );
    throw new AppError(MESSAGE.CCCD_UPLOAD_FAILED, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }
};

module.exports = {
  verifyAndUpload,
  createVerificationReceipt,
  consumeVerificationReceipt,
  signedAssetUrl,
};
