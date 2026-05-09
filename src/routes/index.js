const express = require("express");
const router = express.Router();

const authRoutes = require("../modules/auth/auth.routes");
const userRoutes = require("../modules/users/user.routes");
const tutorRoutes = require("../modules/tutors/tutor.routes");
const locationRoutes = require("../modules/locations/location.routes");
const notificationRoutes = require("../modules/notifications/notification.routes");
const classRoutes = require("../modules/classes/class.routes");

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/tutors", tutorRoutes);
router.use("/locations", locationRoutes);
router.use("/notifications", notificationRoutes);
router.use("/classes", classRoutes);

module.exports = router;
