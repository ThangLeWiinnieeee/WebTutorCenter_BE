const notificationService = require("../services/notification.service");
const { successResponse } = require("../utils/response");
const HTTP_STATUS = require("../constants/status");

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.user.id);
    return successResponse(res, {
      message: "Lấy danh sách thông báo thành công",
      data: { notifications },
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id);
    return successResponse(res, {
      message: "Đã đánh dấu đã đọc",
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    return successResponse(res, {
      message: "Đã đánh dấu tất cả đã đọc",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
