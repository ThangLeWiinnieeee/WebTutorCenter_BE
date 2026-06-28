const HTTP_STATUS = require("../constants/status");
const MESSAGE = require("../constants/message");

// Phân biệt 2 loại lỗi:
//  - Lỗi do người dùng thao tác sai (AppError, hoặc lỗi có chủ đích với mã 4xx):
//    trả message thật để FE hiển thị cho người dùng.
//  - Lỗi hệ thống (ngoài dự kiến: bug, lỗi DB, lỗi tích hợp...): CHỈ ghi log ở terminal BE,
//    không lộ chi tiết kỹ thuật ra phía FE (tránh rò rỉ thông tin & gây khó hiểu cho người dùng).
const errorMiddleware = (err, req, res, next) => {
  const isUserError = err.isUserError === true || (err.statusCode && err.statusCode < 500);

  if (isUserError) {
    return res.status(err.statusCode || HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
  }

  // Lỗi hệ thống → log đầy đủ ở terminal BE để dev điều tra.
  console.error(`[SYSTEM ERROR] ${req.method} ${req.originalUrl}`);
  console.error(err.stack || err);

  // FE chỉ nhận thông báo chung chung, không kèm message kỹ thuật hay stack trace.
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: MESSAGE.INTERNAL_SERVER_ERROR,
  });
};

module.exports = errorMiddleware;
