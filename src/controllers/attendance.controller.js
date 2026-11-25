const attendanceService = require("../services/attendance.service");
const { successResponse } = require("../utils/response");
const HTTP_STATUS = require("../constants/status");
const MESSAGE = require("../constants/message");

const getClassOverview = async (req, res, next) => {
  try {
    const data = await attendanceService.getClassOverview(
      req.user.id,
      req.user.role,
      req.params.classId,
      req.query
    );
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.ATTENDANCE_OVERVIEW_SUCCESS,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getClassSessions = async (req, res, next) => {
  try {
    const data = await attendanceService.getClassSessions(
      req.user.id,
      req.user.role,
      req.params.classId,
      req.query
    );
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.ATTENDANCE_SESSIONS_SUCCESS,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getSessionDetail = async (req, res, next) => {
  try {
    const data = await attendanceService.getSessionDetail(
      req.user.id,
      req.user.role,
      req.params.id
    );
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.ATTENDANCE_SESSION_DETAIL_SUCCESS,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const checkInSession = async (req, res, next) => {
  try {
    const data = await attendanceService.checkInSession(
      req.user.id,
      req.params.classId,
      {
        file: req.file,
        photoUrl: req.body?.photoUrl,
      }
    );
    return successResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: MESSAGE.ATTENDANCE_CHECKIN_SUCCESS,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const confirmCheckIn = async (req, res, next) => {
  try {
    const data = await attendanceService.confirmCheckIn(req.user.id, req.params.id);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.ATTENDANCE_CHECKIN_CONFIRM_SUCCESS,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const rejectCheckIn = async (req, res, next) => {
  try {
    const data = await attendanceService.rejectCheckIn(
      req.user.id,
      req.params.id,
      req.body.reason
    );
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.ATTENDANCE_CHECKIN_REJECT_SUCCESS,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const checkOutSession = async (req, res, next) => {
  try {
    const data = await attendanceService.checkOutSession(
      req.user.id,
      req.params.id,
      {
        file: req.file,
        photoUrl: req.body?.photoUrl,
      }
    );
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.ATTENDANCE_CHECKOUT_SUCCESS,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const confirmCheckOut = async (req, res, next) => {
  try {
    const data = await attendanceService.confirmCheckOut(req.user.id, req.params.id);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.ATTENDANCE_CHECKOUT_CONFIRM_SUCCESS,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const rejectCheckOut = async (req, res, next) => {
  try {
    const data = await attendanceService.rejectCheckOut(
      req.user.id,
      req.params.id,
      req.body.reason
    );
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.ATTENDANCE_CHECKOUT_REJECT_SUCCESS,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const openDispute = async (req, res, next) => {
  try {
    const data = await attendanceService.openDispute(
      req.user.id,
      req.user.role,
      req.params.id,
      req.body
    );
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.ATTENDANCE_DISPUTE_SUCCESS,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getAdminSessions = async (req, res, next) => {
  try {
    const data = await attendanceService.getAdminSessions(req.query);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.ATTENDANCE_ADMIN_LIST_SUCCESS,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const adminConfirmOnBehalf = async (req, res, next) => {
  try {
    const data = await attendanceService.adminConfirmOnBehalf(
      req.user.id,
      req.params.id,
      req.body
    );
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.ATTENDANCE_ADMIN_CONFIRM_SUCCESS,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const adminResolveSession = async (req, res, next) => {
  try {
    const data = await attendanceService.adminResolveSession(
      req.user.id,
      req.params.id,
      req.body
    );
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.ATTENDANCE_RESOLVE_SUCCESS,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const adminInitPeriod = async (req, res, next) => {
  try {
    const data = await attendanceService.adminInitPeriodForClass(
      req.params.classId,
      req.body
    );
    return successResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: MESSAGE.ATTENDANCE_INIT_PERIOD_SUCCESS,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClassOverview,
  getClassSessions,
  getSessionDetail,
  checkInSession,
  confirmCheckIn,
  rejectCheckIn,
  checkOutSession,
  confirmCheckOut,
  rejectCheckOut,
  openDispute,
  getAdminSessions,
  adminConfirmOnBehalf,
  adminResolveSession,
  adminInitPeriod,
};
