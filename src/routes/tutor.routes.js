const express = require("express");
const router = express.Router();

const tutorController = require("../controllers/tutor.controller");
const { tutorValidation } = require("../validations");
const { registerTutorSchema, profileChangeRequestSchema, validate } = tutorValidation;
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/register", authMiddleware, validate(registerTutorSchema), tutorController.registerTutor);
router.get("/profile", authMiddleware, tutorController.getTutorProfile);

// Gia sư đổi hồ sơ — chờ admin duyệt
router.get("/profile/change-request", authMiddleware, tutorController.getMyProfileChangeRequest);
router.post(
  "/profile/change-request",
  authMiddleware,
  validate(profileChangeRequestSchema),
  tutorController.requestProfileChange
);

// Public routes
router.get("/active", tutorController.getActiveTutors);
router.get("/top", tutorController.getTopTutors);
router.get("/top/month/current", tutorController.getTopTutorsThisMonth);
router.get("/new", tutorController.getNewTutors);
router.get("/search", tutorController.searchActiveTutors);
router.get("/:id", tutorController.getTutorById);

module.exports = router;
