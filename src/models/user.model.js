const mongoose = require("mongoose");
const ROLES = require("../constants/role");
const ACCOUNT_TYPE = require("../constants/accountType");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Họ tên là bắt buộc"],
      trim: true,
      minlength: [2, "Họ tên phải có ít nhất 2 ký tự"],
      maxlength: [100, "Họ tên không được vượt quá 100 ký tự"],
    },
    email: {
      type: String,
      required: [true, "Email là bắt buộc"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email không hợp lệ"],
    },
    password: {
      type: String,
      minlength: [6, "Mật khẩu phải có ít nhất 6 ký tự"],
      select: false,
      default: null,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER,
    },
    type: {
      type: String,
      enum: Object.values(ACCOUNT_TYPE),
      default: ACCOUNT_TYPE.LOCAL,
    },
    phone: {
      type: String,
      default: null,
      trim: true,
      match: [/^(0[3|5|7|8|9])+([0-9]{8})$/, "Số điện thoại không hợp lệ"],
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", null],
      default: null,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    phoneActivated: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
