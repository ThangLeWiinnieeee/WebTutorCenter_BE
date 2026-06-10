const express = require("express");
const router = express.Router();

const tutorController = require("../controllers/tutor.controller");
const { registerTutorSchema, rejectTutorSchema, validate } = require("../validations/tutor.validation");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

router.post("/register", authMiddleware, validate(registerTutorSchema), tutorController.registerTutor);
router.get("/profile", authMiddleware, tutorController.getTutorProfile);

// Public routes - lấy danh sách gia sư
router.get("/active", tutorController.getActiveTutors);
router.get("/top", tutorController.getTopTutors);
router.get("/top/month/current", tutorController.getTopTutorsThisMonth);
router.get("/new", tutorController.getNewTutors);
router.get("/search", tutorController.searchActiveTutors);
router.get("/:id", tutorController.getTutorById);

// Admin routes
router.get("/admin/stats", authMiddleware, roleMiddleware("admin"), tutorController.getDashboardStats);
router.get("/admin/pending", authMiddleware, roleMiddleware("admin"), tutorController.getPendingTutors);
router.patch("/admin/:id/approve", authMiddleware, roleMiddleware("admin"), tutorController.approveTutor);
router.patch("/admin/:id/reject", authMiddleware, roleMiddleware("admin"), validate(rejectTutorSchema), tutorController.rejectTutor);

module.exports = router;
