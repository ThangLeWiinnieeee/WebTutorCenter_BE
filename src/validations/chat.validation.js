const Joi = require("joi");
const { validate, validateQuery } = require("../middlewares/validate.middleware");

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

const sendMessageSchema = Joi.object({
  content: Joi.string().trim().min(1).max(2000).required().messages({
    "string.empty": "Vui lòng nhập nội dung tin nhắn",
    "string.min": "Vui lòng nhập nội dung tin nhắn",
    "string.max": "Nội dung tin nhắn không được vượt quá 2000 ký tự",
    "any.required": "Vui lòng nhập nội dung tin nhắn",
  }),
});

const startConversationSchema = Joi.object({
  tutorUserId: objectId.required().messages({
    "string.empty": "Thiếu thông tin gia sư",
    "string.pattern.base": "Mã gia sư không hợp lệ",
    "any.required": "Thiếu thông tin gia sư",
  }),
});

const messagesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(30),
});

const conversationsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  keyword: Joi.string().trim().allow("").max(100).optional(),
});

module.exports = {
  validate,
  validateQuery,
  sendMessageSchema,
  startConversationSchema,
  messagesQuerySchema,
  conversationsQuerySchema,
};
