const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const tutorRoutes = require("./tutor.routes");
const locationRoutes = require("./location.routes");
const notificationRoutes = require("./notification.routes");

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/tutors", tutorRoutes);
router.use("/locations", locationRoutes);
router.use("/notifications", notificationRoutes);
router.use("/classes", classRoutes);

module.exports = router;
