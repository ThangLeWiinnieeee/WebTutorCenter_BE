const { ClassApplication, CLASS_APPLICATION_STATUS } = require("../models/class.application.model");

const POPULATE_CLASS = "classCode subject locationLabel feePerSession feePerMonth sessionsPerWeek minutesPerSession";
const POPULATE_TUTOR_USER = "fullName email avatar";

const create = async (data) => {
  const doc = new ClassApplication(data);
  return await doc.save();
};

const findById = async (id) => {
  return await ClassApplication.findById(id)
    .populate("classId", POPULATE_CLASS)
    .populate({
      path: "tutorId",
      populate: { path: "userId", select: POPULATE_TUTOR_USER },
    });
};

const findByClassAndTutor = async (classId, tutorId) => {
  return await ClassApplication.findOne({ classId, tutorId }).lean();
};

const findAllPending = async () => {
  return await ClassApplication.find({ status: CLASS_APPLICATION_STATUS.PENDING })
    .populate("classId", POPULATE_CLASS)
    .populate({
      path: "tutorId",
      populate: { path: "userId", select: POPULATE_TUTOR_USER },
    })
    .sort({ createdAt: -1 });
};

const findByStatus = async (status) => {
  const filter = status && status !== "all" ? { status } : {};
  return await ClassApplication.find(filter)
    .populate("classId", POPULATE_CLASS)
    .populate({
      path: "tutorId",
      populate: { path: "userId", select: POPULATE_TUTOR_USER },
    })
    .sort({ createdAt: -1 });
};

const countAll = async () => {
  const [pending, approved, rejected] = await Promise.all([
    ClassApplication.countDocuments({ status: CLASS_APPLICATION_STATUS.PENDING }),
    ClassApplication.countDocuments({ status: CLASS_APPLICATION_STATUS.APPROVED }),
    ClassApplication.countDocuments({ status: CLASS_APPLICATION_STATUS.REJECTED }),
  ]);
  return { pending, approved, rejected };
};

const update = async (id, updateData) => {
  return await ClassApplication.findByIdAndUpdate(id, updateData, { new: true })
    .populate("classId", POPULATE_CLASS)
    .populate({
      path: "tutorId",
      populate: { path: "userId", select: POPULATE_TUTOR_USER },
    });
};

const countPending = async () => {
  return await ClassApplication.countDocuments({ status: CLASS_APPLICATION_STATUS.PENDING });
};

module.exports = {
  create,
  findById,
  findByClassAndTutor,
  findAllPending,
  findByStatus,
  update,
  countPending,
  countAll,
};
