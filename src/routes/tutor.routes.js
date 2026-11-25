const express = require("express");
const router = express.Router();

const tutorController = require("../controllers/tutor.controller");
const { tutorValidation } = require("../validations");
const {
  registerTutorSchema,
  profileChangeRequestSchema,
  activeTutorsQuerySchema,
  topTutorsQuerySchema,
  newTutorsQuerySchema,
  searchTutorsQuerySchema,
  searchFilterEventSchema,
  validate,
  validateQuery,
} = tutorValidation;
const { validateObjectIdParams } = require("../validations/common.validation");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const ROLES = require("../constants/role");
const { uploadDocumentMiddleware } = require("../utils/upload");
const MESSAGE = require("../constants/message");
const { requireUploadedFile } = require("../middlewares/upload.middleware");

router.post("/register", authMiddleware, validate(registerTutorSchema), tutorController.registerTutor);
router.post(
  "/upload-document",
  authMiddleware,
  uploadDocumentMiddleware,
  requireUploadedFile(MESSAGE.TUTOR_UPLOAD_DOC_FAILED),
  tutorController.uploadDocument
);
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
router.get("/active", validateQuery(activeTutorsQuerySchema), tutorController.getActiveTutors);
router.get("/top", validateQuery(topTutorsQuerySchema), tutorController.getTopTutors);
router.get("/top/month/current", validateQuery(topTutorsQuerySchema), tutorController.getTopTutorsThisMonth);
router.get("/new", validateQuery(newTutorsQuerySchema), tutorController.getNewTutors);
// Token không bắt buộc: học viên đăng nhập được xếp hạng cá nhân hóa, khách thấy thứ tự chung
router.get(
  "/search",
  authMiddleware.optional,
  validateQuery(searchTutorsQuerySchema),
  tutorController.searchActiveTutors
);
router.post(
  "/search/filter-events",
  authMiddleware,
  roleMiddleware(ROLES.USER),
  validate(searchFilterEventSchema),
  tutorController.recordSearchFilter
);
router.get("/:id", validateObjectIdParams("id"), tutorController.getTutorById);

module.exports = router;
