const express = require("express");
const router = express.Router();

const reviewController = require("../controllers/review.controller");
const {
  validateQuery,
  adminListReviewTutorsQuerySchema,
  adminListTutorReviewsQuerySchema,
} = require("../validations/review.validation");

// Quản lý đánh giá gia sư (/admin/reviews) — tái sử dụng review.controller
router.get("/tutors", validateQuery(adminListReviewTutorsQuerySchema), reviewController.getAdminReviewTutors);
router.get("/tutors/:tutorId", validateQuery(adminListTutorReviewsQuerySchema), reviewController.getAdminTutorReviews);
router.delete("/:id", reviewController.softDeleteReview);

module.exports = router;
