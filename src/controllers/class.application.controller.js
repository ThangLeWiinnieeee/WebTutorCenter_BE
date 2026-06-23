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
    const result = await classApplicationService.getMyApplications(req.user.id, req.query);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.CLASS_APPLICATION_LIST_SUCCESS,
      data: result,
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

const cancelApplication = async (req, res, next) => {
  try {
    const application = await classApplicationService.cancelApplication(
      req.user.id,
      req.params.id,
      req.body.reason
    );
    const message =
      application.status === "cancelled"
        ? MESSAGE.CLASS_APPLICATION_CANCEL_SUCCESS
        : MESSAGE.CLASS_APPLICATION_CANCEL_REQUEST_SUCCESS;
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message,
      data: { application },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

module.exports = { applyForClass, getMyApplications, cancelApplication };
