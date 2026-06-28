const tutorAdminService = require("../services/tutorAdmin.service");
const { successResponse } = require("../utils/response");
const AppError = require("../utils/AppError");
const HTTP_STATUS = require("../constants/status");

const handleError = (error, res, next) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  next(error);
};

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await tutorAdminService.getDashboardStats();
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
    const result = await tutorAdminService.getPendingTutors(req.query);
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
    const tutor = await tutorAdminService.approveTutor(req.params.id);
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
    const tutor = await tutorAdminService.rejectTutor(req.params.id, req.body.rejectionReason);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Từ chối hồ sơ gia sư thành công",
      data: { tutor },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

module.exports = {
  getDashboardStats,
  getPendingTutors,
  approveTutor,
  rejectTutor,
};
