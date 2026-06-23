const Joi = require("joi");
const ROLES = require("../constants/role");
const { SUBJECTS, PHONE_REGEX, GENDER_OPTIONS } = require("../constants/tutor");
const { validate, validateQuery } = require("../middlewares/validate.middleware");

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

const rejectClassApplicationSchema = Joi.object({
  rejectionReason: Joi.string().trim().min(5).max(500).required().messages({
    "string.empty": "Lý do từ chối không được để trống",
    "string.min": "Lý do từ chối phải có ít nhất 5 ký tự",
    "string.max": "Lý do từ chối không được vượt quá 500 ký tự",
    "any.required": "Lý do từ chối là bắt buộc",
  }),
});

const adminListClassApplicationsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid("pending", "approved", "rejected", "all").default("pending"),
});

const adminListPendingTutorsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

// ──────────────────────────── Class (bài đăng) schemas ────────────────────────────

const adminListClassesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  keyword: Joi.string().trim().allow("").max(100).optional(),
  subject: Joi.string().valid(...SUBJECTS).allow("").optional(),
});

// ──────────────────────────── Trash (thùng rác) schemas ────────────────────────────

const adminTrashListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

// ──────────────────────────── Profile change request schemas ────────────────────────────

const adminListProfileChangesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid("pending", "approved", "rejected", "all").default("pending"),
});

const rejectProfileChangeSchema = Joi.object({
  rejectionReason: Joi.string().trim().min(5).max(500).required().messages({
    "string.empty": "Lý do từ chối không được để trống",
    "string.min": "Lý do từ chối phải có ít nhất 5 ký tự",
    "string.max": "Lý do từ chối không được vượt quá 500 ký tự",
    "any.required": "Lý do từ chối là bắt buộc",
  }),
});

// ──────────────────────────── Hủy đơn nhận lớp schemas ────────────────────────────

const adminListCancellationsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid("cancel_requested", "cancelled", "all").default("cancel_requested"),
});

// Admin từ chối yêu cầu hủy — lý do không bắt buộc
const rejectCancellationSchema = Joi.object({
  rejectionReason: Joi.string().trim().max(500).allow("", null).optional(),
});

module.exports = {
  validate,
  validateQuery,
  adminListUsersQuerySchema,
  adminUpdateUserSchema,
  adminUpdateUserStatusSchema,
  rejectTutorSchema,
  rejectClassApplicationSchema,
  adminListClassApplicationsQuerySchema,
  adminListPendingTutorsQuerySchema,
  adminListClassesQuerySchema,
  adminTrashListQuerySchema,
  adminListProfileChangesQuerySchema,
  rejectProfileChangeSchema,
  adminListCancellationsQuerySchema,
  rejectCancellationSchema,
};
