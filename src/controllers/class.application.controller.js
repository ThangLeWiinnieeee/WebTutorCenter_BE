const classApplicationService = require("../services/class.application.service");
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

const applyForClass = async (req, res, next) => {
  try {
    const application = await classApplicationService.applyForClass(req.user.id, req.params.id);
    return successResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: MESSAGE.CLASS_APPLICATION_APPLY_SUCCESS,
      data: { application },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

const getMyApplications = async (req, res, next) => {
  try {
    const applications = await classApplicationService.getMyApplications(req.user.id, req.query);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.CLASS_APPLICATION_LIST_SUCCESS,
      data: { applications },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

module.exports = { applyForClass, getMyApplications };
