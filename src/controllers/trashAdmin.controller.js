const trashAdminService = require("../services/trashAdmin.service");
const { successResponse } = require("../utils/response");
const AppError = require("../utils/AppError");
const HTTP_STATUS = require("../constants/status");

const handleError = (error, res, next) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  next(error);
};

const getTrashItems = async (req, res, next) => {
  try {
    const data = await trashAdminService.getTrashItems(req.params.type, req.query);
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
    const counts = await trashAdminService.getTrashCounts();
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
    const result = await trashAdminService.restoreTrashItem(req.params.type, req.params.id);
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
    const result = await trashAdminService.purgeTrashItem(req.params.type, req.params.id);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Đã xóa vĩnh viễn",
      data: result,
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

module.exports = {
  getTrashItems,
  getTrashCounts,
  restoreTrashItem,
  purgeTrashItem,
};
