const { Notification } = require("../models/notification.model");

const create = async ({ userId, type, message }) => {
  return Notification.create({ userId, type, message });
};

const findByUserId = async (userId) => {
  return Notification.find({ userId }).sort({ createdAt: -1 }).lean();
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

module.exports = {
  create,
  findByUserId,
  markAsRead,
  markAllAsRead,
};
