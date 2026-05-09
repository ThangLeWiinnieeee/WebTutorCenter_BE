const express = require("express");
const router = express.Router();

const tutorController = require("../controllers/tutor.controller");
const { registerTutorSchema, rejectTutorSchema, validate } = require("../validations/tutor.validation");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

router.post("/register", authMiddleware, validate(registerTutorSchema), tutorController.registerTutor);
router.get("/profile", authMiddleware, tutorController.getTutorProfile);

// Admin routes
router.get("/admin/stats", authMiddleware, roleMiddleware("admin"), tutorController.getDashboardStats);
router.get("/admin/pending", authMiddleware, roleMiddleware("admin"), tutorController.getPendingTutors);
router.patch("/admin/:id/approve", authMiddleware, roleMiddleware("admin"), tutorController.approveTutor);
router.patch("/admin/:id/reject", authMiddleware, roleMiddleware("admin"), validate(rejectTutorSchema), tutorController.rejectTutor);

module.exports = router;
