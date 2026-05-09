const notificationRepository = require("../repositories/notification.repository");
const AppError = require("../utils/AppError");
const HTTP_STATUS = require("../constants/status");

const _formatNotification = (n) => ({
  id: n._id,
  type: n.type,
  message: n.message,
  read: n.read,
  createdAt: n.createdAt,
});

const createNotification = async ({ userId, type, message }) => {
  const notification = await notificationRepository.create({ userId, type, message });
  return _formatNotification(notification);
};

const getUserNotifications = async (userId) => {
  const notifications = await notificationRepository.findByUserId(userId);
  return notifications.map(_formatNotification);
};

const markAsRead = async (notificationId, userId) => {
  const notification = await notificationRepository.markAsRead(notificationId, userId);
  if (!notification) {
    throw new AppError("Không tìm thấy thông báo", HTTP_STATUS.NOT_FOUND);
  }
  return _formatNotification(notification);
};

const markAllAsRead = async (userId) => {
  await notificationRepository.markAllAsRead(userId);
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
};
