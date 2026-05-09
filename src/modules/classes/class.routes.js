const express = require("express");
const classController = require("./class.controller");
const {
  quoteClassSchema,
  createClassSchema,
  listClassQuerySchema,
  validateBody,
  validateQuery,
} = require("./class.validation");
const authMiddleware = require("../../core/middlewares/auth.middleware");

const router = express.Router();

router.post("/quote", authMiddleware, validateBody(quoteClassSchema), classController.quoteClass);
router.post("/", authMiddleware, validateBody(createClassSchema), classController.createClass);
router.get("/subjects", classController.getSubjects);
router.get("/", validateQuery(listClassQuerySchema), classController.getClasses);
router.get("/:id", classController.getClassDetail);

module.exports = router;
