const Joi = require("joi");
const { validate, validateQuery } = require("../middlewares/validate.middleware");

// ──────────────────────────── Schemas ────────────────────────────

const createPromoSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(3).max(50).required().messages({
    "string.empty": "Vui lòng nhập mã ưu đãi",
    "string.min": "Mã ưu đãi phải có ít nhất 3 ký tự",
    "string.max": "Mã ưu đãi tối đa 50 ký tự",
    "any.required": "Vui lòng nhập mã ưu đãi",
  }),
  description: Joi.string().trim().max(200).allow("").optional(),
  discountType: Joi.string().valid("percent", "fixed").required().messages({
    "any.only": "Loại giảm giá không hợp lệ",
    "any.required": "Vui lòng chọn loại giảm giá",
  }),
  discountValue: Joi.number().min(0).required().messages({
    "number.base": "Giá trị giảm không hợp lệ",
    "number.min": "Giá trị giảm phải lớn hơn hoặc bằng 0",
    "any.required": "Vui lòng nhập giá trị giảm",
  }),
  maxDiscountAmount: Joi.number().min(0).allow(null).optional(),
  isActive: Joi.boolean().default(true),
  startsAt: Joi.date().iso().allow(null, "").optional(),
  expiresAt: Joi.date().iso().allow(null, "").optional(),
  usageLimit: Joi.number().integer().min(1).allow(null).optional(),
});

// Update: tất cả optional (partial update) nhưng vẫn ràng buộc khi có giá trị
const updatePromoSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(3).max(50).optional(),
  description: Joi.string().trim().max(200).allow("").optional(),
  discountType: Joi.string().valid("percent", "fixed").optional(),
  discountValue: Joi.number().min(0).optional(),
  maxDiscountAmount: Joi.number().min(0).allow(null).optional(),
  isActive: Joi.boolean().optional(),
  startsAt: Joi.date().iso().allow(null, "").optional(),
  expiresAt: Joi.date().iso().allow(null, "").optional(),
  usageLimit: Joi.number().integer().min(1).allow(null).optional(),
}).min(1);

const listPromosQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  keyword: Joi.string().trim().allow("").max(50).optional(),
  discountType: Joi.string().valid("percent", "fixed").allow("").optional(),
  isActive: Joi.boolean().optional(),
});

const myVouchersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

const validatePromoSchema = Joi.object({
  code: Joi.string().trim().required().messages({
    "string.empty": "Vui lòng nhập mã ưu đãi",
    "any.required": "Vui lòng nhập mã ưu đãi",
  }),
  amount: Joi.number().min(0).required().messages({
    "number.base": "Số tiền không hợp lệ",
    "any.required": "Thiếu số tiền áp dụng",
  }),
});

module.exports = {
  validate,
  validateQuery,
  createPromoSchema,
  updatePromoSchema,
  listPromosQuerySchema,
  myVouchersQuerySchema,
  validatePromoSchema,
};
