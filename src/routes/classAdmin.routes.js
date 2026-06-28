const express = require("express");
const router = express.Router();

const { validateQuery } = require("../middlewares/validate.middleware");
const classAdminController = require("../controllers/classAdmin.controller");
const { adminListClassesQuerySchema } = require("../validations/classAdmin.validation");

// Quản lý bài đăng tìm gia sư (/admin/classes)
router.get("/", validateQuery(adminListClassesQuerySchema), classAdminController.getAdminClasses);
router.get("/:id", classAdminController.getAdminClassDetail);
router.delete("/:id", classAdminController.deleteAdminClass);

module.exports = router;
