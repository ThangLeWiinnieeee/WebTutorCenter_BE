const express = require("express");
const router = express.Router();

const reviewController = require("../controllers/review.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  validate,
  validateQuery,
  createReviewSchema,
  listTutorReviewsQuerySchema,
} = require("../validations/review.validation");

// Người đăng bài tạo đánh giá gia sư (lớp đã hoàn thành) — service tự kiểm tra quyền
router.post("/", authMiddleware, validate(createReviewSchema), reviewController.createReview);

// Danh sách đánh giá công khai của một gia sư (hiển thị ở trang chi tiết gia sư)
router.get(
  "/tutor/:tutorId",
  validateQuery(listTutorReviewsQuerySchema),
  reviewController.getTutorReviews
);

module.exports = router;
