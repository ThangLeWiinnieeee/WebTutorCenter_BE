const { Conversation } = require("../models/conversation.model");

const findByTutorUserId = async (tutorUserId) => {
  return Conversation.findOne({ tutorUserId }).populate("tutorUserId", "fullName email avatar role").lean();
};

const findById = async (id) => {
  return Conversation.findById(id).populate("tutorUserId", "fullName email avatar role").lean();
};

// Tìm hoặc tạo mới cuộc trò chuyện cho gia sư (idempotent, tránh trùng do đua request).
const findOrCreateByTutorUserId = async (tutorUserId) => {
  return Conversation.findOneAndUpdate(
    { tutorUserId },
    { $setOnInsert: { tutorUserId } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )
    .populate("tutorUserId", "fullName email avatar role")
    .lean();
};

// Danh sách hội thoại cho admin (mới hoạt động trước). Lọc theo tên/email gia sư
// được xử lý ở service (cần id user khớp keyword) → ở đây nhận sẵn filter.
const findPageForAdmin = async ({ filter = {}, page = 1, limit = 20 }) => {
  const skip = (Math.max(1, page) - 1) * limit;
  const [items, totalItems] = await Promise.all([
    Conversation.find(filter)
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("tutorUserId", "fullName email avatar role")
      .lean(),
    Conversation.countDocuments(filter),
  ]);
  return { items, totalItems };
};

const updateById = async (id, update) => {
  return Conversation.findByIdAndUpdate(id, update, { new: true })
    .populate("tutorUserId", "fullName email avatar role")
    .lean();
};

// Tổng số tin nhắn admin chưa đọc trên toàn hệ thống (badge cho khu vực admin).
const sumAdminUnread = async () => {
  const [row] = await Conversation.aggregate([
    { $group: { _id: null, total: { $sum: "$adminUnread" } } },
  ]);
  return row?.total || 0;
};

module.exports = {
  findByTutorUserId,
  findById,
  findOrCreateByTutorUserId,
  findPageForAdmin,
  updateById,
  sumAdminUnread,
};
