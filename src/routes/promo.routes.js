const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const promoController = require("../controllers/promo.controller");
const {
  validate,
  validateQuery,
  createPromoSchema,
  updatePromoSchema,
  listPromosQuerySchema,
  validatePromoSchema,
} = require("../validations/promo.validation");

// Người dùng đã đăng nhập kiểm tra/áp dụng mã ở màn báo giá
router.post("/validate", authMiddleware, validate(validatePromoSchema), promoController.validatePromo);

// Admin CRUD mã ưu đãi
router.get("/", authMiddleware, roleMiddleware("admin"), validateQuery(listPromosQuerySchema), promoController.listPromos);
router.post("/", authMiddleware, roleMiddleware("admin"), validate(createPromoSchema), promoController.createPromo);
router.patch("/:id", authMiddleware, roleMiddleware("admin"), validate(updatePromoSchema), promoController.updatePromo);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), promoController.deletePromo);

module.exports = router;
