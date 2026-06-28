const chatService = require("../services/chat.service");
const { successResponse } = require("../utils/response");
const HTTP_STATUS = require("../constants/status");

// ──────────────────────────── Gia sư ────────────────────────────

const getMyConversation = async (req, res, next) => {
  try {
    const result = await chatService.getTutorConversation(req.user.id, req.query);
    return successResponse(res, { message: "Lấy cuộc trò chuyện thành công", data: result });
  } catch (error) {
    next(error);
  }
};

const sendMyMessage = async (req, res, next) => {
  try {
    const message = await chatService.sendMessageAsTutor(req.user.id, { content: req.body.content });
    return successResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: "Đã gửi tin nhắn",
      data: { message },
    });
  } catch (error) {
    next(error);
  }
};

const sendMyImageMessage = async (req, res, next) => {
  try {
    const message = await chatService.sendMessageAsTutor(req.user.id, {
      content: req.body.content,
      imageUrl: req.file?.path,
    });
    return successResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: "Đã gửi tin nhắn",
      data: { message },
    });
  } catch (error) {
    next(error);
  }
};

const markMyConversationRead = async (req, res, next) => {
  try {
    await chatService.markTutorRead(req.user.id);
    return successResponse(res, { message: "Đã đánh dấu đã đọc" });
  } catch (error) {
    next(error);
  }
};

const getMyUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await chatService.getTutorUnreadCount(req.user.id);
    return successResponse(res, { message: "Lấy số tin chưa đọc thành công", data: { unreadCount } });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────── Admin ────────────────────────────

const getConversations = async (req, res, next) => {
  try {
    const result = await chatService.getAdminConversations(req.query);
    return successResponse(res, { message: "Lấy danh sách hội thoại thành công", data: result });
  } catch (error) {
    next(error);
  }
};

const getConversationMessages = async (req, res, next) => {
  try {
    const result = await chatService.getAdminConversationMessages(req.params.id, req.query);
    return successResponse(res, { message: "Lấy tin nhắn thành công", data: result });
  } catch (error) {
    next(error);
  }
};

const sendConversationMessage = async (req, res, next) => {
  try {
    const message = await chatService.sendMessageAsAdmin(req.params.id, req.user.id, {
      content: req.body.content,
    });
    return successResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: "Đã gửi tin nhắn",
      data: { message },
    });
  } catch (error) {
    next(error);
  }
};

const sendConversationImageMessage = async (req, res, next) => {
  try {
    const message = await chatService.sendMessageAsAdmin(req.params.id, req.user.id, {
      content: req.body.content,
      imageUrl: req.file?.path,
    });
    return successResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: "Đã gửi tin nhắn",
      data: { message },
    });
  } catch (error) {
    next(error);
  }
};

const markConversationRead = async (req, res, next) => {
  try {
    await chatService.markAdminRead(req.params.id);
    return successResponse(res, { message: "Đã đánh dấu đã đọc" });
  } catch (error) {
    next(error);
  }
};

const getAdminUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await chatService.getAdminUnreadTotal();
    return successResponse(res, { message: "Lấy số tin chưa đọc thành công", data: { unreadCount } });
  } catch (error) {
    next(error);
  }
};

const startConversation = async (req, res, next) => {
  try {
    const conversation = await chatService.startConversationWithTutor(req.body.tutorUserId);
    return successResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: "Đã mở cuộc trò chuyện",
      data: { conversation },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyConversation,
  sendMyMessage,
  sendMyImageMessage,
  markMyConversationRead,
  getMyUnreadCount,
  getConversations,
  getConversationMessages,
  sendConversationMessage,
  sendConversationImageMessage,
  markConversationRead,
  getAdminUnreadCount,
  startConversation,
};
