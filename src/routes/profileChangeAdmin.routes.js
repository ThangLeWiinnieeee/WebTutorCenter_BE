const express = require("express");
const router = express.Router();

const { validate, validateQuery } = require("../middlewares/validate.middleware");
const profileChangeAdminController = require("../controllers/profileChangeAdmin.controller");
const {
  adminListProfileChangesQuerySchema,
  rejectProfileChangeSchema,
} = require("../validations/profileChangeAdmin.validation");

// Gia sư đổi hồ sơ (/admin/profile-changes)
router.get("/", validateQuery(adminListProfileChangesQuerySchema), profileChangeAdminController.getProfileChanges);
router.patch("/:id/approve", profileChangeAdminController.approveProfileChange);
router.patch("/:id/reject", validate(rejectProfileChangeSchema), profileChangeAdminController.rejectProfileChange);

module.exports = router;
