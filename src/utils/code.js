const AppError = require("./AppError");
const HTTP_STATUS = require("../constants/status");

// Sinh một mã duy nhất: thử tối đa `attempts` lần, mỗi lần tạo ứng viên bằng `generate()`
// rồi kiểm tra đã tồn tại chưa bằng `exists(code)` (trả về truthy nếu đã dùng).
// Trả về mã đầu tiên chưa tồn tại; hết lượt thử thì ném lỗi.
const generateUniqueCode = async ({
  generate,
  exists,
  attempts = 20,
  errorMessage = "Không thể tạo mã, vui lòng thử lại",
}) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const candidate = generate();
    const taken = await exists(candidate);
    if (!taken) return candidate;
  }
  throw new AppError(errorMessage, HTTP_STATUS.INTERNAL_SERVER_ERROR);
};

module.exports = { generateUniqueCode };
