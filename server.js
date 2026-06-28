require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./src/configs/database");
const { startClassLifecycleScheduler } = require("./src/utils/classLifecycle");
const { initSocket } = require("./src/configs/socket");

const PORT = process.env.PORT || 5000;

// Tạo HTTP server để dùng chung cho Express và Socket.IO (chat realtime)
const server = http.createServer(app);
initSocket(server);

connectDB().then(() => {
  // Job định kỳ: đánh dấu hết hạn bài đăng quá giờ học mà chưa có gia sư nhận
  startClassLifecycleScheduler();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });
});
