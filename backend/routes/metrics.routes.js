const express = require("express");
const metricsController = require("../controllers/metrics.controller");

const router = express.Router();

router.get("/metrics", metricsController.metrics);

module.exports = router;
