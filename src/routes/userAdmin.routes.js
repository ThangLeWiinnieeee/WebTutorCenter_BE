const express = require("express");
const router = express.Router();

const { validate, validateQuery } = require("../middlewares/validate.middleware");
const userAdminController = require("../controllers/userAdmin.controller");
const {
  adminListUsersQuerySchema,
  adminUpdateUserSchema,
  adminUpdateUserStatusSchema,
} = require("../validations/userAdmin.validation");

// Quản lý người dùng (/admin/users)
router.get("/", validateQuery(adminListUsersQuerySchema), userAdminController.getAdminUsers);
router.patch("/:id", validate(adminUpdateUserSchema), userAdminController.updateAdminUser);
router.patch("/:id/status", validate(adminUpdateUserStatusSchema), userAdminController.updateAdminUserStatus);
router.delete("/:id", userAdminController.softDeleteAdminUser);

module.exports = router;
