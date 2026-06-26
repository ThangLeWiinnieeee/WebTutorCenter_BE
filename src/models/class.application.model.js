const mongoose = require("mongoose");

const CLASS_APPLICATION_STATUS = {
  // Gia sư đã ứng tuyển, đang chờ người đăng chọn
  PENDING: "pending",
  // Người đăng đã chọn gia sư này, đang chờ admin duyệt
  SELECTED: "selected",
  // Admin đã duyệt → lớp được ghép
  APPROVED: "approved",
  // Admin từ chối gia sư đã chọn (người đăng có thể chọn lại gia sư khác)
  REJECTED: "rejected",
  // Người đăng/admin đã chốt gia sư khác → các ứng viên còn lại bị loại
  NOT_SELECTED: "not_selected",
  CANCEL_REQUESTED: "cancel_requested",
  CANCELLED: "cancelled",
};

const classApplicationSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tutor",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(CLASS_APPLICATION_STATUS),
      default: CLASS_APPLICATION_STATUS.PENDING,
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
  },
  { timestamps: true }
);

classApplicationSchema.index({ classId: 1, tutorId: 1 }, { unique: true });
classApplicationSchema.index({ createdAt: -1 });

const ClassApplication = mongoose.model("ClassApplication", classApplicationSchema);

module.exports = { ClassApplication, CLASS_APPLICATION_STATUS };
