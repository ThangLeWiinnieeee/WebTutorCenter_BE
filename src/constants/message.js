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
  RESET_PASSWORD_SAME_AS_OLD: "Mật khẩu mới không được trùng với mật khẩu cũ",

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

  // Admin
  ADMIN_LIST_USERS_SUCCESS: "Lấy danh sách người dùng thành công",
  ADMIN_UPDATE_USER_SUCCESS: "Cập nhật người dùng thành công",
  ADMIN_UPDATE_USER_STATUS_SUCCESS: "Cập nhật trạng thái người dùng thành công",
  ADMIN_DELETE_USER_SUCCESS: "Xóa người dùng thành công",
  ADMIN_SELF_DEACTIVATE: "Không thể vô hiệu hóa chính tài khoản đang đăng nhập",
  ADMIN_SELF_DELETE: "Không thể xóa chính tài khoản đang đăng nhập",

  // Server
  INTERNAL_SERVER_ERROR: "Lỗi máy chủ nội bộ",
  FORBIDDEN: "Bạn không có quyền thực hiện hành động này",

  // Class Application
  CLASS_APPLICATION_APPLY_SUCCESS: "Yêu cầu nhận lớp đã được gửi, vui lòng chờ admin xét duyệt",
  CLASS_APPLICATION_ALREADY_EXISTS: "Bạn đã gửi yêu cầu nhận lớp này trước đó",
  CLASS_APPLICATION_NOT_FOUND: "Không tìm thấy đơn đăng ký nhận lớp",
  CLASS_APPLICATION_NOT_PENDING: "Đơn đăng ký này không ở trạng thái chờ duyệt",
  CLASS_APPLICATION_LIST_SUCCESS: "Lấy danh sách đơn đăng ký nhận lớp thành công",
  CLASS_APPLICATION_STATS_SUCCESS: "Lấy thống kê đơn đăng ký nhận lớp thành công",
  CLASS_APPLICATION_APPROVE_SUCCESS: "Đã duyệt gia sư cho lớp thành công",
  CLASS_APPLICATION_REJECT_SUCCESS: "Đã từ chối đơn đăng ký nhận lớp",

  // Class
  QUOTE_SUCCESS: "Tính học phí lớp mới thành công",
  CREATE_SUCCESS: "Đăng lớp mới thành công",
  LIST_SUCCESS: "Lấy danh sách lớp mới thành công",
  DETAIL_SUCCESS: "Lấy chi tiết lớp mới thành công",
  SUBJECT_LIST_SUCCESS: "Lấy danh sách môn học thành công",
  PRICING_CONFIG_SUCCESS: "Lấy cấu hình học phí thành công",
  PRICING_CONFIG_MISSING: "Chưa cấu hình học phí, vui lòng chạy seed pricing",
  CLASS_NOT_FOUND: "Không tìm thấy lớp mới",
  INVALID_AREA: "Khu vực tỉnh/quận không hợp lệ",
};

module.exports = MESSAGE;
