const CLASS_APPLICATION_STATUS = {
  // Gia sư đã ứng tuyển, đang chờ người đăng chọn
  PENDING: "pending",
  // Người đăng đã chọn gia sư này, đang chờ admin duyệt
  SELECTED: "selected",
  // Admin đã duyệt → lớp được ghép
  APPROVED: "approved",
  // Admin từ chối gia sư đã chọn (người đăng có thể chọn lại gia sư khác)
  REJECTED: "rejected",
  // Người đăng/admin đã chốt gia sư khác → các ứng viên còn lại bị loại
  NOT_SELECTED: "not_selected",
  CANCEL_REQUESTED: "cancel_requested",
  CANCELLED: "cancelled",
  // Luồng mời trực tiếp: người đăng mời gia sư, đang chờ gia sư phản hồi
  INVITED: "invited",
  // Luồng mời trực tiếp: gia sư từ chối lời mời (kèm rejectionReason)
  INVITE_DECLINED: "invite_declined",
};

// Nguồn gốc đơn nhận lớp:
// - apply: gia sư chủ động ứng tuyển bài đăng công khai
// - invite: người đăng mời gia sư trực tiếp
const CLASS_APPLICATION_ORIGIN = {
  APPLY: "apply",
  INVITE: "invite",
};

module.exports = { CLASS_APPLICATION_STATUS, CLASS_APPLICATION_ORIGIN };
