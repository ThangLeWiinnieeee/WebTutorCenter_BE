const adminService = require("../services/admin.service");
const { successResponse } = require("../utils/response");
const AppError = require("../utils/AppError");
const HTTP_STATUS = require("../constants/status");
const MESSAGE = require("../constants/message");

const handleError = (error, res, next) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  next(error);
};

// ──────────────────────────── User admin ────────────────────────────

const getAdminUsers = async (req, res, next) => {
  try {
    const data = await adminService.getAdminUsers(req.query);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.ADMIN_LIST_USERS_SUCCESS,
      data,
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

const updateAdminUser = async (req, res, next) => {
  try {
    const user = await adminService.updateAdminUser(req.params.id, req.body);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.ADMIN_UPDATE_USER_SUCCESS,
      data: { user },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

const updateAdminUserStatus = async (req, res, next) => {
  try {
    const user = await adminService.updateAdminUserStatus(req.user.id, req.params.id, req.body.isActive);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.ADMIN_UPDATE_USER_STATUS_SUCCESS,
      data: { user },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

const softDeleteAdminUser = async (req, res, next) => {
  try {
    const user = await adminService.softDeleteAdminUser(req.user.id, req.params.id);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.ADMIN_DELETE_USER_SUCCESS,
      data: { user },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

// ──────────────────────────── Class (bài đăng) admin ────────────────────────────

const getAdminClasses = async (req, res, next) => {
  try {
    const data = await adminService.getAdminClasses(req.query);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.LIST_SUCCESS,
      data,
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

const getAdminClassDetail = async (req, res, next) => {
  try {
    const classItem = await adminService.getAdminClassDetail(req.params.id);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.DETAIL_SUCCESS,
      data: { classItem },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

const deleteAdminClass = async (req, res, next) => {
  try {
    const result = await adminService.deleteAdminClass(req.params.id, req.user.id);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Đã chuyển bài đăng vào thùng rác",
      data: result,
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

// ──────────────────────────── Thùng rác (soft-delete) ────────────────────────────

const getTrashItems = async (req, res, next) => {
  try {
    const data = await adminService.getTrashItems(req.params.type, req.query);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Lấy danh sách thùng rác thành công",
      data,
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

const getTrashCounts = async (req, res, next) => {
  try {
    const counts = await adminService.getTrashCounts();
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Lấy số lượng thùng rác thành công",
      data: { counts },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

const restoreTrashItem = async (req, res, next) => {
  try {
    const result = await adminService.restoreTrashItem(req.params.type, req.params.id);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Khôi phục thành công",
      data: result,
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

const purgeTrashItem = async (req, res, next) => {
  try {
    const result = await adminService.purgeTrashItem(req.params.type, req.params.id);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Đã xóa vĩnh viễn",
      data: result,
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

// ──────────────────────────── Tutor admin ────────────────────────────

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Lấy thống kê dashboard thành công",
      data: { stats },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

const getPendingTutors = async (req, res, next) => {
  try {
    const result = await adminService.getPendingTutors(req.query);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Lấy danh sách gia sư chờ duyệt thành công",
      data: result,
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

const approveTutor = async (req, res, next) => {
  try {
    const tutor = await adminService.approveTutor(req.params.id);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Phê duyệt gia sư thành công",
      data: { tutor },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

const rejectTutor = async (req, res, next) => {
  try {
    const tutor = await adminService.rejectTutor(req.params.id, req.body.rejectionReason);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Từ chối hồ sơ gia sư thành công",
      data: { tutor },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

// ──────────────────────────── Class application admin ────────────────────────────

const getClassApplications = async (req, res, next) => {
  try {
    const result = await adminService.getClassApplications(req.query);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.CLASS_APPLICATION_LIST_SUCCESS,
      data: result,
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

const getClassApplicationStats = async (req, res, next) => {
  try {
    const stats = await adminService.getClassApplicationStats();
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Lấy thống kê đơn đăng ký thành công",
      data: { stats },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

const approveClassApplication = async (req, res, next) => {
  try {
    const application = await adminService.approveClassApplication(req.params.id);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.CLASS_APPLICATION_APPROVE_SUCCESS,
      data: { application },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

const rejectClassApplication = async (req, res, next) => {
  try {
    const application = await adminService.rejectClassApplication(req.params.id, req.body.rejectionReason);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.CLASS_APPLICATION_REJECT_SUCCESS,
      data: { application },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

// ──────────────────────────── Hủy đơn nhận lớp (gia sư rút đơn) ────────────────────────────

const getApplicationCancellations = async (req, res, next) => {
  try {
    const result = await adminService.getApplicationCancellations(req.query);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.CLASS_APPLICATION_CANCELLATION_LIST_SUCCESS,
      data: result,
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

const approveCancellation = async (req, res, next) => {
  try {
    const application = await adminService.approveCancellation(req.params.id);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.CLASS_APPLICATION_CANCEL_APPROVE_SUCCESS,
      data: { application },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

const rejectCancellation = async (req, res, next) => {
  try {
    const application = await adminService.rejectCancellation(req.params.id, req.body.rejectionReason);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.CLASS_APPLICATION_CANCEL_REJECT_SUCCESS,
      data: { application },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

// ──────────────────────────── Profile change requests (gia sư đổi hồ sơ) ────────────────────────────

const getProfileChanges = async (req, res, next) => {
  try {
    const result = await adminService.getProfileChangeRequests(req.query);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.PROFILE_CHANGE_LIST_SUCCESS,
      data: result,
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

const approveProfileChange = async (req, res, next) => {
  try {
    const request = await adminService.approveProfileChange(req.params.id, req.user.id);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.PROFILE_CHANGE_APPROVE_SUCCESS,
      data: { request },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

const rejectProfileChange = async (req, res, next) => {
  try {
    const request = await adminService.rejectProfileChange(req.params.id, req.body.rejectionReason, req.user.id);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.PROFILE_CHANGE_REJECT_SUCCESS,
      data: { request },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

module.exports = {
  getAdminUsers,
  updateAdminUser,
  updateAdminUserStatus,
  softDeleteAdminUser,
  getAdminClasses,
  getAdminClassDetail,
  deleteAdminClass,
  getTrashItems,
  getTrashCounts,
  restoreTrashItem,
  purgeTrashItem,
  getDashboardStats,
  getPendingTutors,
  approveTutor,
  rejectTutor,
  getClassApplications,
  getClassApplicationStats,
  approveClassApplication,
  rejectClassApplication,
  getProfileChanges,
  approveProfileChange,
  rejectProfileChange,
  getApplicationCancellations,
  approveCancellation,
  rejectCancellation,
};
