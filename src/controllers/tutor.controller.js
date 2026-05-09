const tutorService = require("../services/tutor.service");
const { successResponse } = require("../utils/response");
const AppError = require("../utils/AppError");
const MESSAGE = require("../constants/message");
const HTTP_STATUS = require("../constants/status");

const handleError = (error, res, next) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  next(error);
};

const registerTutor = async (req, res, next) => {
  try {
    const tutor = await tutorService.registerTutor(req.user.id, req.body);

    return successResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: MESSAGE.TUTOR_REGISTER_SUCCESS,
      data: { tutor },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

const getTutorProfile = async (req, res, next) => {
  try {
    const tutor = await tutorService.getTutorProfile(req.user.id);

    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.TUTOR_GET_SUCCESS,
      data: { tutor },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

const getPendingTutors = async (req, res, next) => {
  try {
    const tutors = await tutorService.getPendingTutors();
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
    const tutor = await tutorService.approveTutor(req.params.id);
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
    const tutor = await tutorService.rejectTutor(req.params.id, req.body.rejectionReason);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Từ chối hồ sơ gia sư thành công",
      data: { tutor },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await tutorService.getDashboardStats();
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Lấy thống kê dashboard thành công",
      data: { stats },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

module.exports = {
  registerTutor,
  getTutorProfile,
  getPendingTutors,
  getDashboardStats,
  approveTutor,
  rejectTutor,
};
