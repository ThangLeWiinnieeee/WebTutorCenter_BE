const mongoose = require("mongoose");

const NOTIFICATION_TYPES = {
  TUTOR_PENDING: "TUTOR_PENDING",
  TUTOR_APPROVED: "TUTOR_APPROVED",
  TUTOR_REJECTED: "TUTOR_REJECTED",
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
