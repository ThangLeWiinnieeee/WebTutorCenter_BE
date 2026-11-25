const Joi = require("joi");
const {
  ATTENDANCE_SESSION_STATUS,
  ADMIN_OVERRIDE_ACTION,
} = require("../constants/attendance");

const overviewQuerySchema = Joi.object({
  periodId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional(),
});

const sessionsQuerySchema = Joi.object({
  periodId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional(),
  status: Joi.string()
    .valid("all", ...Object.values(ATTENDANCE_SESSION_STATUS))
    .default("all"),
});

const checkInBodySchema = Joi.object({
  photoUrl: Joi.string().uri().optional(),
  note: Joi.string().trim().max(500).allow("").optional(),
});

const checkOutBodySchema = Joi.object({
  photoUrl: Joi.string().uri().optional(),
  note: Joi.string().trim().max(500).allow("").optional(),
});

const rejectSessionSchema = Joi.object({
  reason: Joi.string().trim().min(5).max(500).required().messages({
    "string.empty": "Vui lòng nhập lý do từ chối",
    "string.min": "Lý do từ chối phải có ít nhất 5 ký tự",
    "string.max": "Lý do từ chối không được vượt quá 500 ký tự",
    "any.required": "Vui lòng nhập lý do từ chối",
  }),
});

const disputeSessionSchema = Joi.object({
  reason: Joi.string().trim().min(10).max(1000).required().messages({
    "string.empty": "Vui lòng nhập nội dung phản ánh / yêu cầu hỗ trợ",
    "string.min": "Nội dung phản ánh phải có ít nhất 10 ký tự",
    "string.max": "Nội dung phản ánh không được vượt quá 1000 ký tự",
    "any.required": "Vui lòng nhập nội dung phản ánh / yêu cầu hỗ trợ",
  }),
  evidenceUrls: Joi.array().items(Joi.string().uri()).max(5).optional(),
});

const adminConfirmOnBehalfSchema = Joi.object({
  action: Joi.string()
    .valid(...Object.values(ADMIN_OVERRIDE_ACTION))
    .default(ADMIN_OVERRIDE_ACTION.VALIDATE_SESSION),
  reason: Joi.string().trim().min(5).max(1000).required().messages({
    "string.empty": "Vui lòng nhập lý do duyệt điểm danh thay học viên",
    "string.min": "Lý do phải có ít nhất 5 ký tự",
    "string.max": "Lý do không được vượt quá 1000 ký tự",
    "any.required": "Lý do duyệt thay là bắt buộc",
  }),
  verifiedDurationMinutes: Joi.number().integer().min(1).max(600).optional(),
});

const adminResolveSessionSchema = Joi.object({
  decision: Joi.string().valid("VALID", "INVALIDATED").required().messages({
    "any.only": "Quyết định chỉ có thể là VALID hoặc INVALIDATED",
    "any.required": "Vui lòng chọn kết luận xử lý",
  }),
  reason: Joi.string().trim().min(5).max(1000).required().messages({
    "string.empty": "Vui lòng nhập lý do kết luận",
    "string.min": "Lý do kết luận phải có ít nhất 5 ký tự",
    "string.max": "Lý do kết luận không được vượt quá 1000 ký tự",
    "any.required": "Lý do kết luận là bắt buộc",
  }),
  verifiedDurationMinutes: Joi.number().integer().min(0).max(600).optional(),
});

const adminInitPeriodSchema = Joi.object({
  startDate: Joi.date().iso().optional(),
});

const adminSessionsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string()
    .valid("all", "needs_attention", ...Object.values(ATTENDANCE_SESSION_STATUS))
    .default("all"),
  disputeOnly: Joi.boolean().truthy("true").falsy("false").default(false),
  classCode: Joi.string().trim().allow("").max(20).optional(),
});

module.exports = {
  overviewQuerySchema,
  sessionsQuerySchema,
  checkInBodySchema,
  checkOutBodySchema,
  rejectSessionSchema,
  disputeSessionSchema,
  adminConfirmOnBehalfSchema,
  adminResolveSessionSchema,
  adminInitPeriodSchema,
  adminSessionsQuerySchema,
};
