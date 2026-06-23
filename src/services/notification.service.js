const notificationRepository = require("../repositories/notification.repository");
const AppError = require("../utils/AppError");
const HTTP_STATUS = require("../constants/status");
const { NotificationMapper } = require("../mappers");
const { buildPagination } = require("../helper/pagination.helper");

const createNotification = async ({ userId, type, message }) => {
  const notification = await notificationRepository.create({ userId, type, message });
  return NotificationMapper.toDTO(notification);
};

const getUserNotifications = async (userId, query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));

  const [docs, totalItems, unreadCount] = await Promise.all([
    notificationRepository.findByUserIdPage({ userId, page, limit }),
    notificationRepository.countByUserId(userId),
    notificationRepository.countUnread(userId),
  ]);

  return {
    notifications: NotificationMapper.toDTOList(docs),
    unreadCount,
    pagination: buildPagination({ page, limit, totalItems }),
  };
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
