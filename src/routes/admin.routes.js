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
  adminListClassesQuerySchema,
  adminTrashListQuerySchema,
  adminListProfileChangesQuerySchema,
  rejectProfileChangeSchema,
  adminListCancellationsQuerySchema,
  rejectCancellationSchema,
  adminListPendingTutorsQuerySchema,
} = require("../validations/admin.validation");

// Áp dụng auth + admin role check cho tất cả admin routes
router.use(authMiddleware, roleMiddleware("admin"));

// ──────────────────────────── User routes (/admin/users) ────────────────────────────
router.get("/users", validateQuery(adminListUsersQuerySchema), adminController.getAdminUsers);
router.patch("/users/:id", validate(adminUpdateUserSchema), adminController.updateAdminUser);
router.patch("/users/:id/status", validate(adminUpdateUserStatusSchema), adminController.updateAdminUserStatus);
router.delete("/users/:id", adminController.softDeleteAdminUser);

// ──────────────────────────── Class routes (/admin/classes) — quản lý bài đăng tìm gia sư ────────────────────────────
router.get("/classes", validateQuery(adminListClassesQuerySchema), adminController.getAdminClasses);
router.get("/classes/:id", adminController.getAdminClassDetail);
router.delete("/classes/:id", adminController.deleteAdminClass);

// ──────────────────────────── Trash routes (/admin/trash) — thùng rác (xóa mềm) ────────────────────────────
router.get("/trash/counts", adminController.getTrashCounts);
router.get("/trash/:type", validateQuery(adminTrashListQuerySchema), adminController.getTrashItems);
router.patch("/trash/:type/:id/restore", adminController.restoreTrashItem);
router.delete("/trash/:type/:id", adminController.purgeTrashItem);

// ──────────────────────────── Tutor routes (/admin/tutors) ────────────────────────────
router.get("/tutors/stats", adminController.getDashboardStats);
router.get("/tutors/pending", validateQuery(adminListPendingTutorsQuerySchema), adminController.getPendingTutors);
router.patch("/tutors/:id/approve", adminController.approveTutor);
router.patch("/tutors/:id/reject", validate(rejectTutorSchema), adminController.rejectTutor);

// ──────────────────────────── Class application routes (/admin/class-applications) ────────────────────────────
router.get("/class-applications/stats", adminController.getClassApplicationStats);
router.get("/class-applications", validateQuery(adminListClassApplicationsQuerySchema), adminController.getClassApplications);
router.patch("/class-applications/:id/approve", adminController.approveClassApplication);
router.patch("/class-applications/:id/reject", validate(rejectClassApplicationSchema), adminController.rejectClassApplication);

// ──────────────────────────── Application cancellation routes (/admin/application-cancellations) — gia sư hủy đơn ────────────────────────────
router.get("/application-cancellations", validateQuery(adminListCancellationsQuerySchema), adminController.getApplicationCancellations);
router.patch("/application-cancellations/:id/approve", adminController.approveCancellation);
router.patch("/application-cancellations/:id/reject", validate(rejectCancellationSchema), adminController.rejectCancellation);

// ──────────────────────────── Profile change routes (/admin/profile-changes) — gia sư đổi hồ sơ ────────────────────────────
router.get("/profile-changes", validateQuery(adminListProfileChangesQuerySchema), adminController.getProfileChanges);
router.patch("/profile-changes/:id/approve", adminController.approveProfileChange);
router.patch("/profile-changes/:id/reject", validate(rejectProfileChangeSchema), adminController.rejectProfileChange);

module.exports = router;
