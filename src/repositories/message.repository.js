const { Message } = require("../models/message.model");

const create = async ({ conversationId, senderId, senderRole, content, imageUrl = null }) => {
  return Message.create({ conversationId, senderId, senderRole, content, imageUrl });
};

// Một trang tin nhắn của hội thoại. Lấy mới nhất trước rồi đảo lại để FE render
// theo thứ tự thời gian tăng dần (cũ → mới).
const findByConversationPage = async ({ conversationId, page = 1, limit = 30 }) => {
  const skip = (Math.max(1, page) - 1) * limit;
  const docs = await Message.find({ conversationId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  return docs.reverse();
};

const countByConversation = async (conversationId) => {
  return Message.countDocuments({ conversationId });
};

module.exports = {
  create,
  findByConversationPage,
  countByConversation,
};
