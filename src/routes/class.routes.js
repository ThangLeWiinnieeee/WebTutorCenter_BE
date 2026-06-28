const express = require("express");
const classController = require("../controllers/class.controller");
const classApplicationController = require("../controllers/class.application.controller");
const { classValidation } = require("../validations");
const {
  quoteClassSchema,
  createClassSchema,
  createInviteSchema,
  updateClassSchema,
  listClassQuerySchema,
  cancelApplicationSchema,
  declineInvitationSchema,
  validateBody,
  validateQuery,
} = classValidation;
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const router = express.Router();

router.post("/quote", authMiddleware, validateBody(quoteClassSchema), classController.quoteClass);
router.post("/", authMiddleware, validateBody(createClassSchema), classController.createClass);
// Mời gia sư trực tiếp + gia sư phản hồi lời mời (đặt trước "/:id" để không bị nuốt route)
router.post("/invite", authMiddleware, validateBody(createInviteSchema), classController.createInvite);
router.get(
  "/invitations",
  authMiddleware,
  roleMiddleware("tutor"),
  classApplicationController.getMyInvitations,
);
router.post(
  "/invitations/:applicationId/accept",
  authMiddleware,
  roleMiddleware("tutor"),
  classApplicationController.acceptInvitation,
);
router.post(
  "/invitations/:applicationId/decline",
  authMiddleware,
  roleMiddleware("tutor"),
  validateBody(declineInvitationSchema),
  classApplicationController.declineInvitation,
);
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
// Người đăng xem danh sách gia sư ứng tuyển + chọn 1 gia sư (service tự kiểm tra quyền sở hữu)
router.get("/:id/applicants", authMiddleware, classApplicationController.getApplicants);
router.post(
  "/:id/applicants/:applicationId/select",
  authMiddleware,
  classApplicationController.selectApplicant
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
