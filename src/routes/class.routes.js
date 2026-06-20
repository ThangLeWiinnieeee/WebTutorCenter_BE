const express = require("express");
const classController = require("../controllers/class.controller");
const classApplicationController = require("../controllers/class.application.controller");
const { classValidation } = require("../validations");
const {
  quoteClassSchema,
  createClassSchema,
  listClassQuerySchema,
  validateBody,
  validateQuery,
} = classValidation;
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const router = express.Router();

router.post("/quote", authMiddleware, validateBody(quoteClassSchema), classController.quoteClass);
router.post("/", authMiddleware, validateBody(createClassSchema), classController.createClass);
router.get("/subjects", classController.getSubjects);
router.get("/pricing-config", classController.getPricingConfig);
router.get("/", authMiddleware.optional, validateQuery(listClassQuerySchema), classController.getClasses);
router.post("/:id/apply", authMiddleware, roleMiddleware("tutor"), classApplicationController.applyForClass);
router.get("/mine", authMiddleware, roleMiddleware("tutor"), classApplicationController.getMyApplications);
router.get("/feed", authMiddleware, roleMiddleware("tutor"), classController.getClassFeed);
router.get("/my-posts", authMiddleware, classController.getMyPosts);
router.get("/:id", authMiddleware.optional, classController.getClassDetail);

module.exports = router;
