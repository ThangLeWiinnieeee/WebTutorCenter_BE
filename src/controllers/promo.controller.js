const promoService = require("../services/promo.service");
const { successResponse } = require("../utils/response");
const AppError = require("../utils/AppError");
const HTTP_STATUS = require("../constants/status");

const handleError = (error, res, next) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  next(error);
};

// ──────────────────────────── Admin ────────────────────────────

const createPromo = async (req, res, next) => {
  try {
    const promo = await promoService.createPromo(req.body);
    return successResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: "Tạo mã ưu đãi thành công",
      data: { promo },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

const listPromos = async (req, res, next) => {
  try {
    const data = await promoService.listPromos(req.query);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Lấy danh sách mã ưu đãi thành công",
      data,
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

const updatePromo = async (req, res, next) => {
  try {
    const promo = await promoService.updatePromo(req.params.id, req.body);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Cập nhật mã ưu đãi thành công",
      data: { promo },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

const deletePromo = async (req, res, next) => {
  try {
    const promo = await promoService.deletePromo(req.params.id, req.user.id);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Đã chuyển mã ưu đãi vào thùng rác",
      data: { promo },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

// ──────────────────────────── Public (đã đăng nhập) ────────────────────────────

const validatePromo = async (req, res, next) => {
  try {
    const result = await promoService.validatePromoForAmount(req.body.code, req.body.amount);
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Áp dụng mã ưu đãi thành công",
      data: result,
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

module.exports = {
  createPromo,
  listPromos,
  updatePromo,
  deletePromo,
  validatePromo,
};
