const mongoose = require("mongoose");
const classService = require("../services/class.service");
const { successResponse } = require("../utils/response");
const AppError = require("../utils/AppError");
const HTTP_STATUS = require("../constants/status");
const { MESSAGE } = require("../constants/tutor/tutor");

const quoteClass = async (req, res, next) => {
  try {
    const quote = await classService.quoteClass(req.body);
    return successResponse(res, {
      message: MESSAGE.QUOTE_SUCCESS,
      data: quote,
    });
  } catch (error) {
    next(error);
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
    next(error);
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
    next(error);
  }
};

const getClassDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(MESSAGE.CLASS_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }
    const classItem = await classService.getClassById(id);
    return successResponse(res, {
      message: MESSAGE.DETAIL_SUCCESS,
      data: { classItem },
    });
  } catch (error) {
    next(error);
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
    next(error);
  }
};

const getPricingConfig = async (req, res, next) => {
  try {
    const pricingConfig = await classService.getPricingConfig();
    return successResponse(res, {
      message: MESSAGE.PRICING_CONFIG_SUCCESS,
      data: { pricingConfig },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  quoteClass,
  createClass,
  getClasses,
  getClassDetail,
  getSubjects,
  getPricingConfig,
};
