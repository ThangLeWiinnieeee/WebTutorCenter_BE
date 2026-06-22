const mongoose = require("mongoose");

const promoSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 50,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    // Loại giảm: "percent" (giảm theo %) hoặc "fixed" (giảm số tiền cố định, VND)
    discountType: {
      type: String,
      enum: ["percent", "fixed"],
      required: true,
    },
    // percent: 0-100 | fixed: số tiền VND
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    // Trần giảm tối đa cho mã %; null = không giới hạn
    maxDiscountAmount: {
      type: Number,
      min: 0,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startsAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    // Tổng số lượt được dùng; null = không giới hạn
    usageLimit: {
      type: Number,
      min: 1,
      default: null,
    },
    usedCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    // Xóa mềm: đưa mã vào thùng rác thay vì xóa hẳn
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Promo", promoSchema);
