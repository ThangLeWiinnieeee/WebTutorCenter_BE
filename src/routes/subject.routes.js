const express = require("express");
const router = express.Router();

const subjectController = require("../controllers/subject.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

// Public
router.get("/", subjectController.getActiveSubjects);

// Admin
router.get("/admin", authMiddleware, roleMiddleware("admin"), subjectController.getAdminSubjects);
router.post("/", authMiddleware, roleMiddleware("admin"), subjectController.createSubject);
router.patch("/:id", authMiddleware, roleMiddleware("admin"), subjectController.updateSubject);

module.exports = router;
