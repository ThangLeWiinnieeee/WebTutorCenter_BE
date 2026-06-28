const Joi = require("joi");
const ROLES = require("../constants/role");
const { PHONE_REGEX, GENDER_OPTIONS } = require("../constants/tutor");

const adminListUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  keyword: Joi.string().trim().allow("").max(100).optional(),
  role: Joi.string().valid(ROLES.ADMIN, ROLES.USER, ROLES.TUTOR).allow("").optional(),
  isActive: Joi.boolean().optional(),
  isVerified: Joi.boolean().optional(),
});

const adminUpdateUserSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Họ tên không được để trống",
    "string.min": "Họ tên phải có ít nhất 2 ký tự",
    "string.max": "Họ tên không được vượt quá 100 ký tự",
    "any.required": "Họ tên là bắt buộc",
  }),
  phone: Joi.string()
    .trim()
    .pattern(PHONE_REGEX)
    .allow(null, "")
    .optional()
    .messages({
      "string.pattern.base": "Số điện thoại không hợp lệ (phải là số điện thoại Việt Nam 10 số)",
    }),
  gender: Joi.string().valid(...GENDER_OPTIONS).allow(null, "").optional().messages({
    "any.only": "Giới tính không hợp lệ",
  }),
  dateOfBirth: Joi.date().max("now").allow(null, "").optional().messages({
    "date.base": "Ngày sinh không hợp lệ",
    "date.max": "Ngày sinh không được lớn hơn thời gian hiện tại",
  }),
  isVerified: Joi.boolean().required().messages({
    "boolean.base": "Trạng thái xác thực không hợp lệ",
    "any.required": "Trạng thái xác thực là bắt buộc",
  }),
  // Cấp/thu quyền admin: chỉ cho phép user ↔ admin (vai trò gia sư quản qua luồng duyệt).
  role: Joi.string().valid(ROLES.ADMIN, ROLES.USER).optional().messages({
    "any.only": "Vai trò chỉ có thể là học viên hoặc quản trị viên",
  }),
});

const adminUpdateUserStatusSchema = Joi.object({
  isActive: Joi.boolean().required().messages({
    "boolean.base": "Trạng thái tài khoản không hợp lệ",
    "any.required": "Trạng thái tài khoản là bắt buộc",
  }),
});

module.exports = {
  adminListUsersQuerySchema,
  adminUpdateUserSchema,
  adminUpdateUserStatusSchema,
};
