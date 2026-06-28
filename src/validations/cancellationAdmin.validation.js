const Joi = require("joi");

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
  adminListCancellationsQuerySchema,
  rejectCancellationSchema,
};
