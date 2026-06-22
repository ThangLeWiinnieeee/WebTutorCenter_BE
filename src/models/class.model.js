const mongoose = require("mongoose");
const { SUBJECTS, GENDER_OPTIONS, TUTOR_LEVEL_OPTIONS, DAYS_OF_WEEK, PHONE_REGEX } = require("../constants/tutor");

const availabilitySlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: DAYS_OF_WEEK,
      required: true,
    },
    hour: {
      type: Number,
      min: 0,
      max: 23,
      required: true,
    },
  },
  { _id: false }
);

const classSchema = new mongoose.Schema(
  {
    classCode: {
      type: String,
      required: true,
      unique: true,
      match: [/^\d{5}$/, "Mã lớp phải gồm 5 chữ số"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
      match: [PHONE_REGEX, "Số điện thoại liên hệ không hợp lệ"],
    },
    summary: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 2000,
    },
    subject: {
      type: String,
      enum: SUBJECTS,
      required: true,
      index: true,
    },
    studentGender: {
      type: String,
      enum: GENDER_OPTIONS,
      required: true,
    },
    studentCount: {
      type: Number,
      min: 1,
      max: 20,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    minutesPerSession: {
      type: Number,
      min: 60,
      max: 180,
      required: true,
    },
    sessionsPerWeek: {
      type: Number,
      min: 1,
      max: 7,
      required: true,
    },
    provinceCode: {
      type: Number,
      required: true,
      index: true,
    },
    provinceName: {
      type: String,
      trim: true,
    },
    districtCode: {
      type: Number,
      required: true,
      index: true,
    },
    districtName: {
      type: String,
      trim: true,
    },
    locationLabel: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    availabilitySlots: {
      type: [availabilitySlotSchema],
      required: true,
      validate: {
        validator: (slots) => Array.isArray(slots) && slots.length > 0,
        message: "Phải chọn ít nhất 1 khung giờ học",
      },
    },
    tutorGenderPref: {
      type: String,
      enum: [...GENDER_OPTIONS, "any"],
      default: "any",
    },
    tutorLevelPref: {
      type: String,
      enum: TUTOR_LEVEL_OPTIONS,
      default: "any",
    },
    promoCode: {
      type: String,
      default: null,
      trim: true,
      maxlength: 50,
    },
    // Số tiền được giảm trên học phí/tháng nhờ mã ưu đãi (0 nếu không dùng mã)
    promoDiscount: {
      type: Number,
      min: 0,
      default: 0,
    },
    feePerSession: {
      type: Number,
      min: 0,
      required: true,
    },
    feePerMonth: {
      type: Number,
      min: 0,
      required: true,
    },
    // Học phí/tháng sau khi áp mã ưu đãi (= feePerMonth nếu không dùng mã)
    finalFeePerMonth: {
      type: Number,
      min: 0,
    },
    // Xóa mềm: bài đăng vào thùng rác (ẩn khỏi mọi danh sách) thay vì xóa hẳn
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
  { timestamps: true }
);

classSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Class", classSchema);
