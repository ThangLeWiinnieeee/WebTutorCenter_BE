const express = require("express");
const router = express.Router();

const { validate, validateQuery } = require("../middlewares/validate.middleware");
const cancellationAdminController = require("../controllers/cancellationAdmin.controller");
const {
  adminListCancellationsQuerySchema,
  rejectCancellationSchema,
} = require("../validations/cancellationAdmin.validation");

// Gia sư hủy đơn nhận lớp (/admin/application-cancellations)
router.get("/", validateQuery(adminListCancellationsQuerySchema), cancellationAdminController.getApplicationCancellations);
router.patch("/:id/approve", cancellationAdminController.approveCancellation);
router.patch("/:id/reject", validate(rejectCancellationSchema), cancellationAdminController.rejectCancellation);

module.exports = router;
