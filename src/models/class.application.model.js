const mongoose = require("mongoose");

const CLASS_APPLICATION_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
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
  },
  { timestamps: true }
);

classApplicationSchema.index({ classId: 1, tutorId: 1 }, { unique: true });
classApplicationSchema.index({ createdAt: -1 });

const ClassApplication = mongoose.model("ClassApplication", classApplicationSchema);

module.exports = { ClassApplication, CLASS_APPLICATION_STATUS };
