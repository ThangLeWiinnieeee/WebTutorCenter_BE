const express = require("express");
const router = express.Router();

const chatbotController = require("../controllers/chatbot.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { buildChatbotRequest } = require("../middlewares/chatbot.middleware");
const { chatbotRateLimiter } = require("../middlewares/rateLimit.middleware");
const { validate, askSchema } = require("../validations/chatbot.validation");

// Chặn khách trước khi gọi chatbot-service để bảo vệ quota.
// Rate limit → xác thực bắt buộc → validation → dựng payload → controller.
router.post(
  "/",
  chatbotRateLimiter,
  authMiddleware,
  validate(askSchema),
  buildChatbotRequest,
  chatbotController.ask
);

module.exports = router;
