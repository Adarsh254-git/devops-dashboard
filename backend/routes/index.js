const express = require("express");

const router = express.Router();

router.use(require("./auth.routes"));
router.use(require("./health.routes"));
router.use(require("./stats.routes"));
router.use(require("./deployments.routes"));
router.use(require("./workflowRuns.routes"));
router.use(require("./ai.routes"));
router.use(require("./metrics.routes"));

module.exports = router;
