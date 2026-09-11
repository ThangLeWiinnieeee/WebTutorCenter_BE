const express = require("express");
const multer = require("multer");

const cccdController = require("../controllers/cccd.controller");
const HTTP_STATUS = require("../constants/status");
const MESSAGE = require("../constants/message");
const authMiddleware = require("../middlewares/auth.middleware");
const { cccdRateLimiter } = require("../middlewares/rateLimit.middleware");
const AppError = require("../utils/AppError");

const router = express.Router();
const allowedTypes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const CCCD_UPLOAD_LIMITS = Object.freeze({
  fileSize: 8 * 1024 * 1024,
  files: 2,
  fields: 0,
  parts: 2,
});
const hasValidImageSignature = (file) => {
  const bytes = file?.buffer;
  if (!bytes?.length) return false;

  if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (file.mimetype === "image/png") {
    return (
      bytes.length >= 8 &&
      bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    );
  }
  if (file.mimetype === "image/webp") {
    return (
      bytes.length >= 12 &&
      bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
      bytes.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  return false;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: CCCD_UPLOAD_LIMITS,
  fileFilter: (_req, file, callback) => {
    if (allowedTypes.has(file.mimetype)) return callback(null, true);
    return callback(new AppError(MESSAGE.CCCD_FILE_INVALID, HTTP_STATUS.BAD_REQUEST));
  },
}).fields([
  { name: "front", maxCount: 1 },
  { name: "back", maxCount: 1 },
]);

const uploadCccd = (req, res, next) => {
  upload(req, res, (error) => {
    if (error) {
      const message =
        error.code === "LIMIT_FILE_SIZE" ? MESSAGE.CCCD_FILE_TOO_LARGE : MESSAGE.CCCD_FILE_INVALID;
      return next(new AppError(message, HTTP_STATUS.BAD_REQUEST));
    }
    const front = req.files?.front?.[0];
    const back = req.files?.back?.[0];
    if (!front || !back) {
      return next(new AppError(MESSAGE.CCCD_IMAGES_REQUIRED, HTTP_STATUS.BAD_REQUEST));
    }
    if (!hasValidImageSignature(front) || !hasValidImageSignature(back)) {
      return next(new AppError(MESSAGE.CCCD_FILE_INVALID, HTTP_STATUS.BAD_REQUEST));
    }
    return next();
  });
};

router.post("/verify", authMiddleware, cccdRateLimiter, uploadCccd, cccdController.verify);

module.exports = router;
module.exports.hasValidImageSignature = hasValidImageSignature;
module.exports.CCCD_UPLOAD_LIMITS = CCCD_UPLOAD_LIMITS;
