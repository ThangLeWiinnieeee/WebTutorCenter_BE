const mongoose = require("mongoose");

const NOTIFICATION_TYPES = {
  TUTOR_PENDING: "TUTOR_PENDING",
  TUTOR_APPROVED: "TUTOR_APPROVED",
  TUTOR_REJECTED: "TUTOR_REJECTED",
  CLASS_APPLICATION_PENDING: "CLASS_APPLICATION_PENDING",
  CLASS_APPLICATION_APPROVED: "CLASS_APPLICATION_APPROVED",
  CLASS_APPLICATION_REJECTED: "CLASS_APPLICATION_REJECTED",
  PROFILE_CHANGE_PENDING: "PROFILE_CHANGE_PENDING",
  PROFILE_CHANGE_APPROVED: "PROFILE_CHANGE_APPROVED",
  PROFILE_CHANGE_REJECTED: "PROFILE_CHANGE_REJECTED",
  CLASS_APPLICATION_CANCELLED: "CLASS_APPLICATION_CANCELLED",
  CLASS_APPLICATION_CANCEL_REQUESTED: "CLASS_APPLICATION_CANCEL_REQUESTED",
  CLASS_APPLICATION_CANCEL_APPROVED: "CLASS_APPLICATION_CANCEL_APPROVED",
  CLASS_APPLICATION_CANCEL_REJECTED: "CLASS_APPLICATION_CANCEL_REJECTED",
  // Vòng đời bài đăng (gửi cho người đăng)
  CLASS_MATCHED: "CLASS_MATCHED",
  CLASS_EXPIRED: "CLASS_EXPIRED",
  // Hoàn thành lớp → tặng mã giảm giá (gửi cho cả người đăng và gia sư)
  CLASS_COMPLETED_REWARD: "CLASS_COMPLETED_REWARD",
};

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId là bắt buộc"],
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: [true, "Loại thông báo là bắt buộc"],
    },
    message: {
      type: String,
      required: [true, "Nội dung thông báo là bắt buộc"],
      trim: true,
      maxlength: [500, "Nội dung thông báo không được vượt quá 500 ký tự"],
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index: auto-delete documents 7 days after readAt is set
notificationSchema.index({ readAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = { Notification, NOTIFICATION_TYPES };
