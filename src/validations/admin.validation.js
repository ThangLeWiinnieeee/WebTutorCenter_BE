const Joi = require("joi");
const ROLES = require("../constants/role");

// ──────────────────────────── Shared middleware ────────────────────────────

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, convert: true });
  if (error) {
    const errors = error.details.map((d) => d.message);
    return res.status(422).json({ success: false, message: "Dữ liệu đầu vào không hợp lệ", errors });
  }
  req.body = value;
  next();
};

const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, { abortEarly: false });
  if (error) {
    const errors = error.details.map((d) => d.message);
    return res.status(422).json({ success: false, message: "Dữ liệu đầu vào không hợp lệ", errors });
  }
  req.query = value;
  next();
};

// ──────────────────────────── User schemas ────────────────────────────

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
    .pattern(/^(0[3|5|7|8|9])+([0-9]{8})$/)
    .allow(null, "")
    .optional()
    .messages({
      "string.pattern.base": "Số điện thoại không hợp lệ (phải là số điện thoại Việt Nam 10 số)",
    }),
  gender: Joi.string().valid("male", "female", "other").allow(null, "").optional().messages({
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
});

const adminUpdateUserStatusSchema = Joi.object({
  isActive: Joi.boolean().required().messages({
    "boolean.base": "Trạng thái tài khoản không hợp lệ",
    "any.required": "Trạng thái tài khoản là bắt buộc",
  }),
});

// ──────────────────────────── Tutor schemas ────────────────────────────

const rejectTutorSchema = Joi.object({
  rejectionReason: Joi.string().trim().min(5).max(500).required().messages({
    "string.empty": "Lý do từ chối không được để trống",
    "string.min": "Lý do từ chối phải có ít nhất 5 ký tự",
    "string.max": "Lý do từ chối không được vượt quá 500 ký tự",
    "any.required": "Lý do từ chối là bắt buộc",
  }),
});

module.exports = {
  validate,
  validateQuery,
  adminListUsersQuerySchema,
  adminUpdateUserSchema,
  adminUpdateUserStatusSchema,
  rejectTutorSchema,
};
