require("dotenv").config();
const app = require("./app");
const connectDB = require("./src/configs/database");
const { startClassLifecycleScheduler } = require("./src/utils/classLifecycle");

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  // Job định kỳ: đánh dấu hết hạn bài đăng quá giờ học mà chưa có gia sư nhận
  startClassLifecycleScheduler();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });
});
