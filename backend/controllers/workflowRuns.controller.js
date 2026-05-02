const workflowListingService = require("../services/workflowListing.service");
const deploymentModel = require("../models/deployment.model");

async function list(req, res) {
  try {
    const perPage = Math.min(
      Math.max(parseInt(req.query.per_page, 10) || 40, 1),
      100,
    );

    const runs = await workflowListingService.listWorkflowRuns(perPage);
    const body = runs.map(deploymentModel.mapWorkflowRunToListItem);
    res.json(body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { list };
