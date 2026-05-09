const mongoose = require("mongoose");
const classService = require("./class.service");
const { successResponse } = require("../../core/utils/response");
const AppError = require("../../core/utils/AppError");
const HTTP_STATUS = require("../../core/constants/status");
const { MESSAGE } = require("./constants");

const handleError = (error, res, next) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return next(error);
};

const quoteClass = async (req, res, next) => {
  try {
    const quote = await classService.quoteClass(req.body);
    return successResponse(res, {
      message: MESSAGE.QUOTE_SUCCESS,
      data: quote,
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

const createClass = async (req, res, next) => {
  try {
    const created = await classService.createClass(req.body, req.user.id);
    return successResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: MESSAGE.CREATE_SUCCESS,
      data: { classItem: created },
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

const getClasses = async (req, res, next) => {
  try {
    const result = await classService.getClasses(req.query);
    return successResponse(res, {
      message: MESSAGE.LIST_SUCCESS,
      data: result,
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

const getClassDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(MESSAGE.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }
    const classItem = await classService.getClassById(id);
    return successResponse(res, {
      message: MESSAGE.DETAIL_SUCCESS,
      data: { classItem },
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

const getSubjects = async (req, res, next) => {
  try {
    const subjects = await classService.getSubjects();
    return successResponse(res, {
      message: MESSAGE.SUBJECT_LIST_SUCCESS,
      data: { subjects },
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

module.exports = {
  quoteClass,
  createClass,
  getClasses,
  getClassDetail,
  getSubjects,
};
