const mongoose = require("mongoose");
const OTP_TYPE = require("../constants/otpType");

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(OTP_TYPE),
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      // TTL index: MongoDB tự xóa document khi expiresAt đã qua
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Index tìm kiếm nhanh theo email + type
otpSchema.index({ email: 1, type: 1 });

const Otp = mongoose.model("Otp", otpSchema);

module.exports = Otp;
