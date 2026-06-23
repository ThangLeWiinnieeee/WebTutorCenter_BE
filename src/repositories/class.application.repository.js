const { ClassApplication, CLASS_APPLICATION_STATUS } = require("../models/class.application.model");

// Đầy đủ các field bài đăng mà mapper/khu vực admin cần để hiển thị chi tiết.
const POPULATE_CLASS =
  "classCode subject summary description locationLabel provinceCode districtCode provinceName districtName contactPhone feePerSession feePerMonth finalFeePerMonth promoCode promoDiscount sessionsPerWeek minutesPerSession studentCount studentGender startDate availabilitySlots tutorGenderPref tutorLevelPref status createdBy createdAt";
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

// Đơn đã được duyệt (gia sư đang nhận) của một lớp — để xác định gia sư đã ghép
const findApprovedByClassId = async (classId) => {
  return await ClassApplication.findOne({
    classId,
    status: CLASS_APPLICATION_STATUS.APPROVED,
  }).populate({
    path: "tutorId",
    populate: { path: "userId", select: POPULATE_TUTOR_USER },
  });
};

// Danh sách classId đã có gia sư nhận (đơn ở trạng thái pending hoặc approved).
// Dùng để ẩn các bài đăng đã được nhận khỏi feed "Lớp mới theo môn".
const distinctActiveClassIds = async () => {
  return await ClassApplication.distinct("classId", {
    status: {
      $in: [
        CLASS_APPLICATION_STATUS.PENDING,
        CLASS_APPLICATION_STATUS.APPROVED,
        CLASS_APPLICATION_STATUS.CANCEL_REQUESTED,
      ],
    },
  });
};

// Một trang đơn nhận lớp của gia sư (lọc theo trạng thái nếu có), mới nhất trước.
const findByTutorIdPage = async (tutorId, { status, page = 1, limit = 10 }) => {
  const filter = { tutorId };
  if (status && status !== "all") filter.status = status;
  const skip = (Math.max(1, page) - 1) * limit;
  return await ClassApplication.find(filter)
    .populate("classId")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Đếm số đơn theo trạng thái cho một gia sư (phục vụ badge số lượng các tab).
const countByTutorIdGrouped = async (tutorId) => {
  const [pending, approved, rejected, cancelRequested, cancelled] = await Promise.all([
    ClassApplication.countDocuments({ tutorId, status: CLASS_APPLICATION_STATUS.PENDING }),
    ClassApplication.countDocuments({ tutorId, status: CLASS_APPLICATION_STATUS.APPROVED }),
    ClassApplication.countDocuments({ tutorId, status: CLASS_APPLICATION_STATUS.REJECTED }),
    ClassApplication.countDocuments({ tutorId, status: CLASS_APPLICATION_STATUS.CANCEL_REQUESTED }),
    ClassApplication.countDocuments({ tutorId, status: CLASS_APPLICATION_STATUS.CANCELLED }),
  ]);
  return { pending, approved, rejected, cancel_requested: cancelRequested, cancelled };
};

// ── Admin: quản lý đơn bị hủy / yêu cầu hủy ──
const CANCELLATION_STATUSES = [
  CLASS_APPLICATION_STATUS.CANCEL_REQUESTED,
  CLASS_APPLICATION_STATUS.CANCELLED,
];

const findCancellationsPage = async ({ status, page = 1, limit = 10 }) => {
  const filter =
    status && status !== "all" ? { status } : { status: { $in: CANCELLATION_STATUSES } };
  const skip = (Math.max(1, page) - 1) * limit;
  return await ClassApplication.find(filter)
    .populate("classId", POPULATE_CLASS)
    .populate({
      path: "tutorId",
      populate: { path: "userId", select: POPULATE_TUTOR_USER },
    })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit);
};

const countCancellationsGrouped = async () => {
  const [cancelRequested, cancelled] = await Promise.all([
    ClassApplication.countDocuments({ status: CLASS_APPLICATION_STATUS.CANCEL_REQUESTED }),
    ClassApplication.countDocuments({ status: CLASS_APPLICATION_STATUS.CANCELLED }),
  ]);
  return { cancel_requested: cancelRequested, cancelled };
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

// Một trang đơn nhận lớp theo trạng thái (admin duyệt nhận lớp), mới nhất trước.
const findByStatusPage = async ({ status, page = 1, limit = 10 }) => {
  const filter = status && status !== "all" ? { status } : {};
  const skip = (Math.max(1, page) - 1) * limit;
  return await ClassApplication.find(filter)
    .populate("classId", POPULATE_CLASS)
    .populate({
      path: "tutorId",
      populate: { path: "userId", select: POPULATE_TUTOR_USER },
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
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

// Đếm số đơn "đang hoạt động" của một bài đăng (pending/approved/cancel_requested).
// Dùng để chặn chủ bài đăng sửa/xóa khi đã có gia sư ứng tuyển hoặc nhận lớp.
const countActiveByClassId = async (classId) => {
  return await ClassApplication.countDocuments({
    classId,
    status: {
      $in: [
        CLASS_APPLICATION_STATUS.PENDING,
        CLASS_APPLICATION_STATUS.APPROVED,
        CLASS_APPLICATION_STATUS.CANCEL_REQUESTED,
      ],
    },
  });
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
  findApprovedByClassId,
  distinctActiveClassIds,
  findByTutorIdPage,
  countByTutorIdGrouped,
  findCancellationsPage,
  countCancellationsGrouped,
  findAllPending,
  findByStatus,
  findByStatusPage,
  update,
  countPending,
  countAll,
  countActiveByClassId,
  countByClassId,
  countByClassIds,
  deleteByClassId,
};
