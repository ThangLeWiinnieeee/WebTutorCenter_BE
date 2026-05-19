const express = require("express");
const classController = require("../controllers/class.controller");
const {
  quoteClassSchema,
  createClassSchema,
  listClassQuerySchema,
  validateBody,
  validateQuery,
} = require("../validations/class.validation");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/quote", authMiddleware, validateBody(quoteClassSchema), classController.quoteClass);
router.post("/", authMiddleware, validateBody(createClassSchema), classController.createClass);
router.get("/subjects", classController.getSubjects);
router.get("/pricing-config", classController.getPricingConfig);
router.get("/", validateQuery(listClassQuerySchema), classController.getClasses);
router.get("/:id", classController.getClassDetail);

module.exports = router;
