const MESSAGE = {
  // Auth
  REGISTER_SUCCESS: "Đăng ký thành công",
  LOGIN_SUCCESS: "Đăng nhập thành công",
  GOOGLE_LOGIN_SUCCESS: "Đăng nhập bằng Google thành công",
  GOOGLE_TOKEN_INVALID: "Google token không hợp lệ",
  LOGOUT_SUCCESS: "Đăng xuất thành công",
  REFRESH_TOKEN_SUCCESS: "Làm mới token thành công",
  EXISTING_ACCOUNT_LOCAL: "Tài khoản này đã được đăng ký bằng tài khoản local",
  EXISTING_ACCOUNT_GOOGLE: "Tài khoản này đã được đăng nhập bằng Google",

  // User
  USER_NOT_FOUND: "Không tìm thấy người dùng",
  UPDATE_PROFILE_SUCCESS: "Cập nhật thông tin cá nhân thành công",
  UPLOAD_AVATAR_SUCCESS: "Cập nhật ảnh đại diện thành công",
  UPLOAD_AVATAR_FAILED: "Tải ảnh lên thất bại",
  EMAIL_ALREADY_EXISTS: "Email đã được sử dụng",
  INVALID_CREDENTIALS: "Email hoặc mật khẩu không đúng",
  PASSWORD_MISMATCH: "Mật khẩu xác nhận không khớp",
  EMAIL_NOT_VERIFIED: "Email chưa được xác thực, vui lòng kiểm tra hộp thư",
  USER_INFO_SUCCESS: "Lấy thông tin người dùng thành công",

  // OTP
  OTP_SENT: "Mã OTP đã được gửi đến email của bạn",
  OTP_RESENT: "Mã OTP mới đã được gửi đến email của bạn",
  OTP_VERIFY_SUCCESS: "Xác thực email thành công",
  OTP_INVALID: "Mã OTP không hợp lệ",
  OTP_EXPIRED: "Mã OTP đã hết hạn, vui lòng yêu cầu mã mới",
  OTP_ALREADY_VERIFIED: "Email này đã được xác thực",
  OTP_RESEND_TOO_SOON: "Vui lòng chờ trước khi yêu cầu gửi lại mã OTP",

  // Forgot password
  FORGOT_PASSWORD_OTP_SENT: "Mã OTP khôi phục mật khẩu đã được gửi đến email của bạn",
  FORGOT_PASSWORD_OTP_VERIFY_SUCCESS: "Xác thực OTP thành công, vui lòng đặt lại mật khẩu",
  RESET_PASSWORD_SUCCESS: "Đặt lại mật khẩu thành công",
  RESET_TOKEN_INVALID: "Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn",
  ACCOUNT_NOT_CHANGE_PASSWORD: "Tài khoản này không thể đổi mật khẩu (đăng nhập qua Google)",

  // Token
  TOKEN_MISSING: "Không tìm thấy token xác thực",
  TOKEN_INVALID: "Token không hợp lệ hoặc đã hết hạn",
  TOKEN_EXPIRED: "Token đã hết hạn",
  REFRESH_TOKEN_INVALID: "Refresh token không hợp lệ",

  // Validation
  VALIDATION_ERROR: "Dữ liệu đầu vào không hợp lệ",

  // Tutor
  TUTOR_REGISTER_SUCCESS: "Đăng ký làm gia sư thành công, vui lòng chờ phê duyệt",
  TUTOR_ALREADY_REGISTERED: "Bạn đã đăng ký làm gia sư trước đó",
  TUTOR_NOT_FOUND: "Không tìm thấy thông tin gia sư",
  TUTOR_GET_SUCCESS: "Lấy thông tin gia sư thành công",
  TUTOR_UPDATE_SUCCESS: "Cập nhật thông tin gia sư thành công",

  // Server
  INTERNAL_SERVER_ERROR: "Lỗi máy chủ nội bộ",
  FORBIDDEN: "Bạn không có quyền thực hiện hành động này",
};

module.exports = MESSAGE;
