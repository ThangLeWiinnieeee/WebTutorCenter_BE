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
  REGISTRATION_NOT_FOUND: "Phiên đăng ký không tồn tại hoặc đã hết hạn, vui lòng đăng ký lại",

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
  QUERY_VALIDATION_ERROR: "Bộ lọc không hợp lệ",

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
  CLASS_APPLICATION_APPLY_SUCCESS: "Đã ứng tuyển lớp, vui lòng chờ người đăng chọn gia sư",
  CLASS_APPLICATION_ALREADY_EXISTS: "Bạn đã ứng tuyển lớp này trước đó",
  CLASS_APPLICATION_OWN_CLASS: "Bạn không thể nhận lớp do chính mình đăng",
  CLASS_APPLICATION_NOT_FOUND: "Không tìm thấy đơn đăng ký nhận lớp",
  CLASS_APPLICATION_NOT_PENDING: "Đơn đăng ký này không ở trạng thái chờ duyệt",
  CLASS_APPLICATION_NOT_SELECTED_STATUS: "Đơn này chưa được người đăng chọn nên không thể duyệt",
  CLASS_APPLICATION_LIST_SUCCESS: "Lấy danh sách đơn đăng ký nhận lớp thành công",
  CLASS_APPLICATION_STATS_SUCCESS: "Lấy thống kê đơn đăng ký nhận lớp thành công",
  CLASS_APPLICATION_APPROVE_SUCCESS: "Đã duyệt gia sư cho lớp thành công",
  CLASS_APPLICATION_REJECT_SUCCESS: "Đã từ chối đơn đăng ký nhận lớp",

  // Người đăng chọn gia sư từ danh sách ứng tuyển
  CLASS_APPLICANTS_LIST_SUCCESS: "Lấy danh sách gia sư ứng tuyển thành công",
  CLASS_APPLICANT_SELECT_SUCCESS: "Đã chọn gia sư, vui lòng chờ admin duyệt lớp",
  CLASS_APPLICANT_NOT_OWNER: "Bạn không có quyền quản lý ứng tuyển của bài đăng này",
  CLASS_APPLICANT_NOT_PENDING: "Chỉ có thể chọn gia sư đang ở trạng thái chờ",
  CLASS_APPLICANT_CLASS_NOT_OPEN: "Lớp này không còn ở trạng thái mở để chọn gia sư",

  // Hủy đơn nhận lớp (gia sư rút đơn)
  CLASS_APPLICATION_CANCEL_SUCCESS: "Đã hủy đơn nhận lớp",
  CLASS_APPLICATION_CANCEL_REQUEST_SUCCESS: "Đã gửi yêu cầu hủy lớp, vui lòng chờ admin duyệt",
  CLASS_APPLICATION_CANCEL_INVALID_STATUS: "Không thể hủy đơn ở trạng thái hiện tại",
  CLASS_APPLICATION_CANCELLATION_LIST_SUCCESS: "Lấy danh sách đơn hủy thành công",
  CLASS_APPLICATION_CANCEL_NOT_REQUESTED: "Đơn này không ở trạng thái chờ hủy",
  CLASS_APPLICATION_CANCEL_APPROVE_SUCCESS: "Đã duyệt hủy đơn nhận lớp",
  CLASS_APPLICATION_CANCEL_REJECT_SUCCESS: "Đã từ chối yêu cầu hủy đơn",

  // Profile change request (gia sư đổi hồ sơ — chờ admin duyệt)
  PROFILE_CHANGE_REQUEST_SUCCESS: "Đã gửi yêu cầu đổi thông tin, vui lòng chờ admin duyệt",
  PROFILE_CHANGE_GET_SUCCESS: "Lấy yêu cầu đổi thông tin thành công",
  PROFILE_CHANGE_LIST_SUCCESS: "Lấy danh sách yêu cầu đổi thông tin thành công",
  PROFILE_CHANGE_APPROVE_SUCCESS: "Đã duyệt yêu cầu đổi thông tin",
  PROFILE_CHANGE_REJECT_SUCCESS: "Đã từ chối yêu cầu đổi thông tin",
  PROFILE_CHANGE_NOT_FOUND: "Không tìm thấy yêu cầu đổi thông tin",
  PROFILE_CHANGE_NOT_PENDING: "Yêu cầu này không ở trạng thái chờ duyệt",
  PROFILE_CHANGE_ALREADY_PENDING: "Bạn đang có một yêu cầu đổi thông tin chờ duyệt",
  PROFILE_CHANGE_TUTOR_NOT_APPROVED: "Chỉ gia sư đã được duyệt mới có thể đổi hồ sơ",
  PROFILE_CHANGE_EMPTY: "Không có thông tin hợp lệ để cập nhật",
  PROFILE_CHANGE_INVALID_SUBJECTS: "Danh sách môn học không hợp lệ (phải chọn ít nhất 1 môn trong danh mục)",
  PROFILE_CHANGE_SUBJECTS_REMOVE_FORBIDDEN: "Chỉ được bổ sung thêm môn học, không được bỏ môn đã đăng ký",
  PROFILE_CHANGE_INVALID_GRAD_YEAR: "Năm tốt nghiệp là bắt buộc và phải hợp lệ (từ 1950 đến năm hiện tại)",

  // Review (đánh giá gia sư)
  REVIEW_CREATE_SUCCESS: "Đánh giá gia sư thành công, cảm ơn bạn đã nhận xét",
  REVIEW_LIST_SUCCESS: "Lấy danh sách đánh giá thành công",
  REVIEW_ADMIN_TUTORS_SUCCESS: "Lấy danh sách gia sư để quản lý đánh giá thành công",
  REVIEW_DELETE_SUCCESS: "Đã chuyển đánh giá vào thùng rác",
  REVIEW_NOT_FOUND: "Không tìm thấy đánh giá",
  REVIEW_ALREADY_EXISTS: "Bạn đã đánh giá gia sư cho lớp này rồi",
  REVIEW_CLASS_NOT_COMPLETED: "Chỉ có thể đánh giá khi lớp đã hoàn thành",
  REVIEW_NOT_POSTER: "Chỉ người đăng bài mới được đánh giá gia sư của lớp này",
  REVIEW_TUTOR_NOT_FOUND: "Lớp này chưa có gia sư nhận nên không thể đánh giá",

  // Class
  QUOTE_SUCCESS: "Tính học phí lớp mới thành công",
  CREATE_SUCCESS: "Đăng lớp mới thành công",
  LIST_SUCCESS: "Lấy danh sách lớp mới thành công",
  CLASS_FEED_SUCCESS: "Lấy danh sách bài đăng theo môn thành công",
  MY_POSTS_SUCCESS: "Lấy danh sách bài đăng của bạn thành công",
  DETAIL_SUCCESS: "Lấy chi tiết lớp mới thành công",
  SUBJECT_LIST_SUCCESS: "Lấy danh sách môn học thành công",
  SUBJECT_CREATE_SUCCESS: "Thêm môn học thành công",
  SUBJECT_UPDATE_SUCCESS: "Cập nhật môn học thành công",
  SUBJECT_NOT_FOUND: "Không tìm thấy môn học",
  SUBJECT_NAME_REQUIRED: "Tên môn học là bắt buộc",
  SUBJECT_ALREADY_EXISTS: "Môn học này đã tồn tại",
  PRICING_CONFIG_SUCCESS: "Lấy cấu hình học phí thành công",
  PRICING_CONFIG_MISSING: "Chưa cấu hình học phí, vui lòng chạy seed pricing",
  CLASS_NOT_FOUND: "Không tìm thấy lớp mới",
  INVALID_AREA: "Khu vực tỉnh/quận không hợp lệ",
};

module.exports = MESSAGE;
