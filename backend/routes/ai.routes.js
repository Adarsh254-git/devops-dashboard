const express = require("express");
const aiController = require("../controllers/ai.controller");

const router = express.Router();

router.post("/api/ai/analyze-log", aiController.analyzeLog);

module.exports = router;
