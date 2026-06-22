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

// Danh sách classId đã có gia sư nhận (đơn ở trạng thái pending hoặc approved).
// Dùng để ẩn các bài đăng đã được nhận khỏi feed "Lớp mới theo môn".
const distinctActiveClassIds = async () => {
  return await ClassApplication.distinct("classId", {
    status: { $in: [CLASS_APPLICATION_STATUS.PENDING, CLASS_APPLICATION_STATUS.APPROVED] },
  });
};

const findByTutorId = async (tutorId, status) => {
  const filter = { tutorId };
  if (status && status !== "all") filter.status = status;
  return await ClassApplication.find(filter)
    .populate("classId")
    .sort({ createdAt: -1 });
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

// Đếm số đơn nhận lớp của một bài đăng (theo trạng thái nếu có)
const countByClassId = async (classId, status) => {
  const filter = { classId };
  if (status && status !== "all") filter.status = status;
  return await ClassApplication.countDocuments(filter);
};

// Đếm số đơn nhận lớp cho nhiều bài đăng cùng lúc → trả về map { classId: count }
const countByClassIds = async (classIds = []) => {
  if (!classIds.length) return {};
  const rows = await ClassApplication.aggregate([
    { $match: { classId: { $in: classIds } } },
    { $group: { _id: "$classId", count: { $sum: 1 } } },
  ]);
  return rows.reduce((acc, row) => {
    acc[String(row._id)] = row.count;
    return acc;
  }, {});
};

// Xóa toàn bộ đơn nhận lớp thuộc một bài đăng (dùng khi admin xóa bài đăng)
const deleteByClassId = async (classId) => {
  return await ClassApplication.deleteMany({ classId });
};

module.exports = {
  create,
  findById,
  findByClassAndTutor,
  distinctActiveClassIds,
  findByTutorId,
  findAllPending,
  findByStatus,
  update,
  countPending,
  countAll,
  countByClassId,
  countByClassIds,
  deleteByClassId,
};
