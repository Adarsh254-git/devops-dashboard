const workflowRunLogsService = require("../services/workflowRunLogs.service");
const workflowListingService = require("../services/workflowListing.service");
const deploymentModel = require("../models/deployment.model");
const { githubHttpStatus } = require("../utils/githubErrors");

async function list(_req, res) {
  try {
    const runs = await workflowListingService.listWorkflowRuns(5);
    const deployments = runs.map(deploymentModel.mapWorkflowRunToDeployment);
    res.json(deployments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getLogs(req, res) {
  const owner = (process.env.GITHUB_OWNER || "").trim();
  const repo = (process.env.GITHUB_REPO || "").trim();

  if (!owner || !repo) {
    return res.status(503).json({
      error: "GitHub repo is not configured on the server",
      details:
        "Set GITHUB_OWNER and GITHUB_REPO in backend/.env. If you use Docker, ensure docker-compose passes env_file: ./backend/.env and restart the stack.",
    });
  }

  if (!process.env.GITHUB_TOKEN?.trim()) {
    return res.status(503).json({
      error: "GITHUB_TOKEN is missing",
      details:
        "Job log archives require authentication. Use a classic PAT with repo scope, or a fine-grained token with Actions read access.",
    });
  }

  const runNumericId = Number(req.params.runId);
  if (!Number.isFinite(runNumericId)) {
    return res.status(400).json({ error: "Invalid run id", details: req.params.runId });
  }

  try {
    const payload = await workflowRunLogsService.buildLogsResponse(
      owner,
      repo,
      runNumericId,
    );
    res.json(payload);
  } catch (err) {
    if (err.responseBody && typeof err.status === "number") {
      return res.status(err.status).json(err.responseBody);
    }

    console.error("ERROR:", err.message);

    const status = githubHttpStatus(err);
    const isNotFound = status === 404;

    res.status(isNotFound ? 404 : status >= 400 ? status : 500).json({
      error: "Failed to fetch logs",
      details: isNotFound
        ? `${err.message} Confirm GITHUB_OWNER="${owner}" and GITHUB_REPO="${repo}" match the repo that owns run ${runNumericId}.`
        : err.message,
    });
  }
}

module.exports = { list, getLogs };
