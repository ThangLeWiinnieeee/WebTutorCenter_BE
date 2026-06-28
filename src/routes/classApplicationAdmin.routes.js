const express = require("express");
const router = express.Router();

const { validate, validateQuery } = require("../middlewares/validate.middleware");
const classApplicationAdminController = require("../controllers/classApplicationAdmin.controller");
const {
  rejectClassApplicationSchema,
  adminListClassApplicationsQuerySchema,
} = require("../validations/classApplicationAdmin.validation");

// Duyệt đơn nhận lớp (/admin/class-applications)
router.get("/stats", classApplicationAdminController.getClassApplicationStats);
router.get("/", validateQuery(adminListClassApplicationsQuerySchema), classApplicationAdminController.getClassApplications);
router.patch("/:id/approve", classApplicationAdminController.approveClassApplication);
router.patch("/:id/reject", validate(rejectClassApplicationSchema), classApplicationAdminController.rejectClassApplication);

module.exports = router;
