const express = require("express");
const router = express.Router();

const lookupController = require("../controllers/lookup.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

// Public routes
router.get("/all", lookupController.getAllGrouped);
router.get("/type/:type", lookupController.getByType);
router.get("/districts/:province", lookupController.getDistrictsByProvince);

// Admin routes (create, update, delete)
router.post("/", authMiddleware, roleMiddleware("admin"), lookupController.createLookup);
router.post("/bulk", authMiddleware, roleMiddleware("admin"), lookupController.createManyLookups);
router.patch("/:id", authMiddleware, roleMiddleware("admin"), lookupController.updateLookup);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), lookupController.deleteLookup);
router.delete("/type/:type", authMiddleware, roleMiddleware("admin"), lookupController.deleteByType);

module.exports = router;
