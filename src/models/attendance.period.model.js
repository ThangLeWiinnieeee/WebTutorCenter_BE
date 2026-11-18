const mongoose = require("mongoose");
const { ATTENDANCE_PERIOD_STATUS } = require("../constants/attendance");

const attendancePeriodSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassApplication",
      required: true,
      index: true,
    },
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tutor",
      required: true,
      index: true,
    },
    tutorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    posterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    periodNumber: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    anchorDay: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    sessionsPerWeek: {
      type: Number,
      required: true,
      min: 1,
      max: 7,
    },
    minutesPerSession: {
      type: Number,
      required: true,
      min: 30,
      max: 300,
    },
    monthlyTarget: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: Object.values(ATTENDANCE_PERIOD_STATUS),
      default: ATTENDANCE_PERIOD_STATUS.ACTIVE,
      index: true,
    },
    stats: {
      week1Count: { type: Number, default: 0 },
      week2Count: { type: Number, default: 0 },
      week3Count: { type: Number, default: 0 },
      week4Count: { type: Number, default: 0 },
      extraDaysCount: { type: Number, default: 0 },
      totalValidCount: { type: Number, default: 0 },
      needsReviewCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

attendancePeriodSchema.index(
  { classId: 1, periodNumber: 1 },
  { unique: true, name: "uniq_attendance_period_per_class" }
);
attendancePeriodSchema.index({ applicationId: 1, periodNumber: 1 });

const AttendancePeriod = mongoose.model("AttendancePeriod", attendancePeriodSchema);

module.exports = { AttendancePeriod };
