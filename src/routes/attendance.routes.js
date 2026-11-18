const express = require("express");
const router = express.Router();

const attendanceController = require("../controllers/attendance.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const { validate, validateQuery } = require("../middlewares/validate.middleware");
const { uploadAttendancePhotoMiddleware } = require("../middlewares/attendanceUpload.middleware");
const { validateObjectIdParams } = require("../validations/common.validation");
const {
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
} = require("../validations/attendance.validation");

// Tất cả endpoint điểm danh đều yêu cầu đăng nhập
router.use(authMiddleware);

// ──────────────────────────── Admin routes ────────────────────────────
router.get(
  "/admin/sessions",
  roleMiddleware("admin"),
  validateQuery(adminSessionsQuerySchema),
  attendanceController.getAdminSessions
);

router.patch(
  "/admin/sessions/:id/confirm-on-behalf",
  roleMiddleware("admin"),
  validateObjectIdParams("id"),
  validate(adminConfirmOnBehalfSchema),
  attendanceController.adminConfirmOnBehalf
);

router.patch(
  "/admin/sessions/:id/resolve",
  roleMiddleware("admin"),
  validateObjectIdParams("id"),
  validate(adminResolveSessionSchema),
  attendanceController.adminResolveSession
);

router.post(
  "/admin/classes/:classId/init-period",
  roleMiddleware("admin"),
  validateObjectIdParams("classId"),
  validate(adminInitPeriodSchema),
  attendanceController.adminInitPeriod
);

// ──────────────────────────── Class & Session routes (Tutor / Poster / Admin) ────────────────────────────
router.get(
  "/classes/:classId/overview",
  validateObjectIdParams("classId"),
  validateQuery(overviewQuerySchema),
  attendanceController.getClassOverview
);

router.get(
  "/classes/:classId/sessions",
  validateObjectIdParams("classId"),
  validateQuery(sessionsQuerySchema),
  attendanceController.getClassSessions
);

router.post(
  "/classes/:classId/sessions/check-in",
  roleMiddleware("tutor"),
  validateObjectIdParams("classId"),
  uploadAttendancePhotoMiddleware,
  validate(checkInBodySchema),
  attendanceController.checkInSession
);

router.get(
  "/sessions/:id",
  validateObjectIdParams("id"),
  attendanceController.getSessionDetail
);

router.patch(
  "/sessions/:id/confirm-checkin",
  validateObjectIdParams("id"),
  attendanceController.confirmCheckIn
);

router.patch(
  "/sessions/:id/reject-checkin",
  validateObjectIdParams("id"),
  validate(rejectSessionSchema),
  attendanceController.rejectCheckIn
);

router.post(
  "/sessions/:id/check-out",
  roleMiddleware("tutor"),
  validateObjectIdParams("id"),
  uploadAttendancePhotoMiddleware,
  validate(checkOutBodySchema),
  attendanceController.checkOutSession
);

router.patch(
  "/sessions/:id/confirm-checkout",
  validateObjectIdParams("id"),
  attendanceController.confirmCheckOut
);

router.patch(
  "/sessions/:id/reject-checkout",
  validateObjectIdParams("id"),
  validate(rejectSessionSchema),
  attendanceController.rejectCheckOut
);

router.post(
  "/sessions/:id/dispute",
  validateObjectIdParams("id"),
  validate(disputeSessionSchema),
  attendanceController.openDispute
);

module.exports = router;
