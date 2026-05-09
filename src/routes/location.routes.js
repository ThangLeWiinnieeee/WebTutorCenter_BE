const express = require("express");
const router = express.Router();

const locationController = require("../controllers/location.controller");

router.get("/provinces", locationController.getProvinces);
router.get("/provinces/:provinceCode/districts", locationController.getDistricts);
router.get("/schools", locationController.getSchools);

module.exports = router;
