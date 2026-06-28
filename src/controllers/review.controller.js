const reviewService = require("../services/review.service");
const { successResponse } = require("../utils/response");
const HTTP_STATUS = require("../constants/status");
const MESSAGE = require("../constants/message");

// ──────────────────────────── Người đăng / công khai ────────────────────────────

const createReview = async (req, res, next) => {
  try {
    const data = await reviewService.createReview(req.user.id, req.body);
    return successResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: MESSAGE.REVIEW_CREATE_SUCCESS,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getTutorReviews = async (req, res, next) => {
  try {
    const data = await reviewService.getTutorReviews(req.params.tutorId, req.query);
    return successResponse(res, {
      message: MESSAGE.REVIEW_LIST_SUCCESS,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────── Admin ────────────────────────────

const getAdminReviewTutors = async (req, res, next) => {
  try {
    const data = await reviewService.getTutorsForAdmin(req.query);
    return successResponse(res, {
      message: MESSAGE.REVIEW_ADMIN_TUTORS_SUCCESS,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getAdminTutorReviews = async (req, res, next) => {
  try {
    const data = await reviewService.getTutorReviewsForAdmin(req.params.tutorId, req.query);
    return successResponse(res, {
      message: MESSAGE.REVIEW_LIST_SUCCESS,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const softDeleteReview = async (req, res, next) => {
  try {
    const result = await reviewService.softDeleteReview(req.params.id, req.user.id);
    return successResponse(res, {
      message: MESSAGE.REVIEW_DELETE_SUCCESS,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getTutorReviews,
  getAdminReviewTutors,
  getAdminTutorReviews,
  softDeleteReview,
};
