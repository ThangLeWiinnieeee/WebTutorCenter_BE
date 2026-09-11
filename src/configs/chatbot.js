const { createInternalClient } = require("../utils/serviceClient");

const internalSecret = (process.env.CHATBOT_INTERNAL_SECRET || "").trim();
if (process.env.NODE_ENV === "production" && internalSecret.length < 32) {
  throw new Error("CHATBOT_INTERNAL_SECRET phải có ít nhất 32 ký tự ở production");
}

// Client gọi chatbot-service (FastAPI riêng), cấu hình đọc từ .env
const chatbotClient = createInternalClient({
  baseURL: process.env.CHATBOT_URL || "http://localhost:8001",
  secret: internalSecret,
  timeout: Number(process.env.CHATBOT_TIMEOUT_MS) || 20000,
  serviceLabel: "Trợ lý ảo",
});

module.exports = chatbotClient;
