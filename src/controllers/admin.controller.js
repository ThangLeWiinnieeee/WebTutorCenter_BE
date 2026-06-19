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
    const tutors = await adminService.getPendingTutors();
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Lấy danh sách gia sư chờ duyệt thành công",
      data: { tutors },
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
    const applications = await adminService.getClassApplications(req.query);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.CLASS_APPLICATION_LIST_SUCCESS,
      data: { applications },
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

module.exports = {
  getAdminUsers,
  updateAdminUser,
  updateAdminUserStatus,
  softDeleteAdminUser,
  getDashboardStats,
  getPendingTutors,
  approveTutor,
  rejectTutor,
  getClassApplications,
  getClassApplicationStats,
  approveClassApplication,
  rejectClassApplication,
};
