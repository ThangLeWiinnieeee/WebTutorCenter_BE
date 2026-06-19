const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const adminController = require("../controllers/admin.controller");
const {
  validate,
  validateQuery,
  adminListUsersQuerySchema,
  adminUpdateUserSchema,
  adminUpdateUserStatusSchema,
  rejectTutorSchema,
  rejectClassApplicationSchema,
  adminListClassApplicationsQuerySchema,
} = require("../validations/admin.validation");

// Áp dụng auth + admin role check cho tất cả admin routes
router.use(authMiddleware, roleMiddleware("admin"));

// ──────────────────────────── User routes (/admin/users) ────────────────────────────
router.get("/users", validateQuery(adminListUsersQuerySchema), adminController.getAdminUsers);
router.patch("/users/:id", validate(adminUpdateUserSchema), adminController.updateAdminUser);
router.patch("/users/:id/status", validate(adminUpdateUserStatusSchema), adminController.updateAdminUserStatus);
router.delete("/users/:id", adminController.softDeleteAdminUser);

// ──────────────────────────── Tutor routes (/admin/tutors) ────────────────────────────
router.get("/tutors/stats", adminController.getDashboardStats);
router.get("/tutors/pending", adminController.getPendingTutors);
router.patch("/tutors/:id/approve", adminController.approveTutor);
router.patch("/tutors/:id/reject", validate(rejectTutorSchema), adminController.rejectTutor);

// ──────────────────────────── Class application routes (/admin/class-applications) ────────────────────────────
router.get("/class-applications/stats", adminController.getClassApplicationStats);
router.get("/class-applications", validateQuery(adminListClassApplicationsQuerySchema), adminController.getClassApplications);
router.patch("/class-applications/:id/approve", adminController.approveClassApplication);
router.patch("/class-applications/:id/reject", validate(rejectClassApplicationSchema), adminController.rejectClassApplication);

module.exports = router;
