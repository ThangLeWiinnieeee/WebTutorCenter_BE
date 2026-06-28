const express = require("express");
const router = express.Router();

const { validateQuery } = require("../middlewares/validate.middleware");
const trashAdminController = require("../controllers/trashAdmin.controller");
const { adminTrashListQuerySchema } = require("../validations/trashAdmin.validation");

// Thùng rác — xóa mềm (/admin/trash)
router.get("/counts", trashAdminController.getTrashCounts);
router.get("/:type", validateQuery(adminTrashListQuerySchema), trashAdminController.getTrashItems);
router.patch("/:type/:id/restore", trashAdminController.restoreTrashItem);
router.delete("/:type/:id", trashAdminController.purgeTrashItem);

module.exports = router;
