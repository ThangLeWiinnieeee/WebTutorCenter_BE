const express = require("express");
const classController = require("../controllers/class.controller");
const classApplicationController = require("../controllers/class.application.controller");
const { classValidation } = require("../validations");
const {
  quoteClassSchema,
  createClassSchema,
  updateClassSchema,
  listClassQuerySchema,
  cancelApplicationSchema,
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
router.post(
  "/applications/:id/cancel",
  authMiddleware,
  roleMiddleware("tutor"),
  validateBody(cancelApplicationSchema),
  classApplicationController.cancelApplication
);
router.get("/mine", authMiddleware, roleMiddleware("tutor"), classApplicationController.getMyApplications);
router.get("/feed", authMiddleware, roleMiddleware("tutor"), classController.getClassFeed);
router.get("/my-posts", authMiddleware, classController.getMyPosts);
// Người đăng / gia sư xác nhận hoàn thành lớp (service tự phân quyền theo người gọi)
router.post("/:id/complete", authMiddleware, classController.completeClass);
// Chủ bài đăng sửa / xóa bài của mình (service tự kiểm tra quyền sở hữu + ràng buộc)
router.put("/:id", authMiddleware, validateBody(updateClassSchema), classController.updateClass);
router.delete("/:id", authMiddleware, classController.deleteClass);
router.get("/:id", authMiddleware.optional, classController.getClassDetail);

module.exports = router;
