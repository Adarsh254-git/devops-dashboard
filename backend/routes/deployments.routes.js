const express = require("express");
const deploymentsController = require("../controllers/deployments.controller");

const router = express.Router();

router.get("/api/deployments/:runId/logs", deploymentsController.getLogs);
router.get("/api/deployments", deploymentsController.list);

module.exports = router;
