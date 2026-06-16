const notificationRepository = require("../repositories/notification.repository");
const AppError = require("../utils/AppError");
const HTTP_STATUS = require("../constants/status");
const { NotificationMapper } = require("../mappers");

const createNotification = async ({ userId, type, message }) => {
  const notification = await notificationRepository.create({ userId, type, message });
  return NotificationMapper.toDTO(notification);
};

const getUserNotifications = async (userId) => {
  const notifications = await notificationRepository.findByUserId(userId);
  return NotificationMapper.toDTOList(notifications);
};

const markAsRead = async (notificationId, userId) => {
  const notification = await notificationRepository.markAsRead(notificationId, userId);
  if (!notification) {
    throw new AppError("Không tìm thấy thông báo", HTTP_STATUS.NOT_FOUND);
  }
  return NotificationMapper.toDTO(notification);
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
