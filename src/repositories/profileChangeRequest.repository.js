const ProfileChangeRequest = require("../models/profileChangeRequest.model");
const { PROFILE_CHANGE_STATUS } = require("../constants/profileChangeRequest");

const POPULATE_USER = "fullName email avatar";

const create = async (data) => {
  const doc = new ProfileChangeRequest(data);
  return await doc.save();
};

const findPendingByTutorId = async (tutorId) => {
  return await ProfileChangeRequest.findOne({
    tutorId,
    status: PROFILE_CHANGE_STATUS.PENDING,
  });
};

const findById = async (id) => {
  return await ProfileChangeRequest.findById(id)
    .populate("userId", POPULATE_USER)
    .populate("tutorId");
};

// Một trang yêu cầu (lọc theo trạng thái nếu có), mới nhất trước.
const findPage = async ({ status, page = 1, limit = 10 }) => {
  const filter = {};
  if (status && status !== "all") filter.status = status;
  const skip = (Math.max(1, page) - 1) * limit;
  return await ProfileChangeRequest.find(filter)
    .populate("userId", POPULATE_USER)
    .populate("tutorId")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

const countGrouped = async () => {
  const [pending, approved, rejected] = await Promise.all([
    ProfileChangeRequest.countDocuments({ status: PROFILE_CHANGE_STATUS.PENDING }),
    ProfileChangeRequest.countDocuments({ status: PROFILE_CHANGE_STATUS.APPROVED }),
    ProfileChangeRequest.countDocuments({ status: PROFILE_CHANGE_STATUS.REJECTED }),
  ]);
  return { pending, approved, rejected };
};

const update = async (id, updateData) => {
  return await ProfileChangeRequest.findByIdAndUpdate(id, updateData, { new: true })
    .populate("userId", POPULATE_USER)
    .populate("tutorId");
};

module.exports = {
  create,
  findPendingByTutorId,
  findById,
  findPage,
  countGrouped,
  update,
};
