const express = require("express");
const workflowRunsController = require("../controllers/workflowRuns.controller");

const router = express.Router();

router.get("/api/workflow-runs", workflowRunsController.list);

module.exports = router;
