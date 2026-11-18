const mongoose = require("mongoose");
const {
  ATTENDANCE_SESSION_STATUS,
  ATTENDANCE_DISPUTE_STATUS,
  ADMIN_OVERRIDE_ACTION,
} = require("../constants/attendance");

const attendanceSessionSchema = new mongoose.Schema(
  {
    periodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendancePeriod",
      required: true,
      index: true,
    },
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
    sessionNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    targetWeek: {
      type: Number,
      enum: [1, 2, 3, 4, 0],
      required: true,
    },
    checkInAt: { type: Date, default: null },
    confirmedCheckInAt: { type: Date, default: null },
    checkOutAt: { type: Date, default: null },
    confirmedCheckOutAt: { type: Date, default: null },
    checkInExpireAt: { type: Date, default: null },
    checkOutExpireAt: { type: Date, default: null },
    checkInPhoto: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      uploadedAt: { type: Date, default: null },
    },
    checkOutPhoto: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      uploadedAt: { type: Date, default: null },
    },
    durationMinutes: { type: Number, default: 0 },
    requiredMinutes: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(ATTENDANCE_SESSION_STATUS),
      default: ATTENDANCE_SESSION_STATUS.WAITING_CHECKIN_CONFIRMATION,
      index: true,
    },
    rejectionReason: { type: String, trim: true, maxlength: 500, default: null },
    failureReason: { type: String, trim: true, maxlength: 500, default: null },
    adminOverride: {
      isOverridden: { type: Boolean, default: false },
      overriddenBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      overriddenAt: { type: Date, default: null },
      action: {
        type: String,
        enum: [...Object.values(ADMIN_OVERRIDE_ACTION), null],
        default: null,
      },
      reason: { type: String, trim: true, maxlength: 1000, default: null },
      verifiedDurationMinutes: { type: Number, default: null },
    },
    dispute: {
      isDisputed: { type: Boolean, default: false },
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      requestedByRole: { type: String, enum: ["tutor", "user", null], default: null },
      requestedAt: { type: Date, default: null },
      reason: { type: String, trim: true, maxlength: 1000, default: null },
      evidenceUrls: [{ type: String }],
      status: {
        type: String,
        enum: Object.values(ATTENDANCE_DISPUTE_STATUS),
        default: ATTENDANCE_DISPUTE_STATUS.NONE,
        index: true,
      },
      resolution: {
        resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        resolvedAt: { type: Date, default: null },
        decision: { type: String, enum: ["VALID", "INVALIDATED", null], default: null },
        verifiedDurationMinutes: { type: Number, default: null },
        notes: { type: String, trim: true, maxlength: 1000, default: null },
        history: [
          {
            previousDecision: String,
            newDecision: String,
            reason: String,
            verifiedDurationMinutes: Number,
            modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            modifiedAt: Date,
          },
        ],
      },
    },
  },
  { timestamps: true }
);

attendanceSessionSchema.index(
  { periodId: 1, sessionNumber: 1 },
  { unique: true, name: "uniq_session_number_per_period" }
);
attendanceSessionSchema.index({ tutorId: 1, status: 1 });
attendanceSessionSchema.index({ classId: 1, createdAt: -1 });

const AttendanceSession = mongoose.model("AttendanceSession", attendanceSessionSchema);

module.exports = { AttendanceSession };
