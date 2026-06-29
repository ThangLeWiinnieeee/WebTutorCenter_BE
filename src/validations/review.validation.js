const Joi = require("joi");
const { validate, validateQuery } = require("../middlewares/validate.middleware");

// Người đăng tạo đánh giá gia sư cho một lớp đã hoàn thành
const createReviewSchema = Joi.object({
  classId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.empty": "Thiếu thông tin lớp cần đánh giá",
      "string.pattern.base": "Mã lớp không hợp lệ",
      "any.required": "Thiếu thông tin lớp cần đánh giá",
    }),
  rating: Joi.number().integer().min(1).max(5).required().messages({
    "number.base": "Số sao đánh giá không hợp lệ",
    "number.min": "Vui lòng chọn từ 1 đến 5 sao",
    "number.max": "Số sao tối đa là 5",
    "any.required": "Vui lòng chọn số sao đánh giá",
  }),
  comment: Joi.string().trim().min(5).max(1000).required().messages({
    "string.empty": "Vui lòng nhập nhận xét cho gia sư",
    "string.min": "Nhận xét phải có ít nhất 5 ký tự",
    "string.max": "Nhận xét không được vượt quá 1000 ký tự",
    "any.required": "Vui lòng nhập nhận xét cho gia sư",
  }),
});

// Gia sư phản hồi một đánh giá (1 lần duy nhất)
const replyReviewSchema = Joi.object({
  comment: Joi.string().trim().min(2).max(1000).required().messages({
    "string.empty": "Vui lòng nhập nội dung phản hồi",
    "string.min": "Phản hồi phải có ít nhất 2 ký tự",
    "string.max": "Phản hồi không được vượt quá 1000 ký tự",
    "any.required": "Vui lòng nhập nội dung phản hồi",
  }),
});

// Phân trang danh sách đánh giá công khai của gia sư
const listTutorReviewsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(5),
});

// Admin: danh sách gia sư để quản lý đánh giá
const adminListReviewTutorsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  keyword: Joi.string().trim().allow("").max(100).optional(),
});

// Admin: danh sách đánh giá của một gia sư
const adminListTutorReviewsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

module.exports = {
  validate,
  validateQuery,
  createReviewSchema,
  replyReviewSchema,
  listTutorReviewsQuerySchema,
  adminListReviewTutorsQuerySchema,
  adminListTutorReviewsQuerySchema,
};
