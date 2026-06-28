const { Notification } = require("../models/notification.model");

const create = async ({ userId, type, message }) => {
  return Notification.create({ userId, type, message });
};

const findByUserId = async (userId) => {
  return Notification.find({ userId }).sort({ createdAt: -1 }).lean();
};

// Một trang thông báo của người dùng, mới nhất trước.
const findByUserIdPage = async ({ userId, page = 1, limit = 10 }) => {
  const skip = (Math.max(1, page) - 1) * limit;
  return Notification.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

const countByUserId = async (userId) => {
  return Notification.countDocuments({ userId });
};

const countUnread = async (userId) => {
  return Notification.countDocuments({ userId, read: false });
};

const markAsRead = async (notificationId, userId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true, readAt: new Date() },
    { new: true }
  ).lean();
};

const markAllAsRead = async (userId) => {
  const now = new Date();
  return Notification.updateMany(
    { userId, read: false },
    { read: true, readAt: now }
  );
};

// Xóa toàn bộ thông báo của một người dùng (xóa vĩnh viễn tài khoản)
const deleteByUserId = async (userId) => {
  return Notification.deleteMany({ userId });
};

module.exports = {
  create,
  findByUserId,
  findByUserIdPage,
  countByUserId,
  countUnread,
  markAsRead,
  markAllAsRead,
  deleteByUserId,
};
