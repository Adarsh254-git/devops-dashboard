require("dotenv").config();
const express = require("express");
const { Octokit } = require("@octokit/rest");
const cors = require("cors");
const promClient = require("prom-client");
const os = require("os");
const osUtils = require("os-utils");

const app = express();
const PORT = Number(process.env.PORT || 5000);
app.use(cors());

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Create a dedicated registry so it’s easy to export metrics.
const register = new promClient.Registry();
register.setDefaultLabels({ app: "devops-dashboard" });

// Default process/Node metrics.
promClient.collectDefaultMetrics({ register });

const requestDurationMs = new promClient.Histogram({
  name: "http_request_duration_ms",
  help: "HTTP request duration in milliseconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [10, 25, 50, 100, 250, 500, 1000, 2000, 5000],
  registers: [register],
});

// Observe request duration for all routes.
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    const route = req.route?.path || req.path;
    requestDurationMs.observe(
      {
        method: req.method,
        route,
        status_code: String(res.statusCode),
      },
      durationMs,
    );
  });
  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/stats", (req, res) => {
  osUtils.cpuUsage((value) => {
    // value is a decimal (e.g., 0.15 for 15%), so we multiply by 100
    const cpuUsage = (value * 100).toFixed(2);

    // Calculate Memory Usage
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const memUsage = (((totalMem - freeMem) / totalMem) * 100).toFixed(2);

    res.json({
      cpuUsage: parseFloat(cpuUsage),
      memoryUsage: parseFloat(memUsage),
      timestamp: new Date().toLocaleTimeString(),
    });
  });
});

app.get("/api/deployments", async (req, res) => {
  try {
    const response = await octokit.actions.listWorkflowRuns({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      // Change this to the actual filename of your yaml file
      workflow_id: "main.yml",
      per_page: 5,
    });

    const deployments = response.data.workflow_runs.map((run) => ({
      id: run.id,  
      commitMsg: run.head_commit?.message || "Manual Run",
      status:
        run.conclusion === "success"
          ? "success"
          : run.status === "completed"
            ? "failure"
            : "pending",
      time: formatRelativeTime(run.created_at),
      env: run.head_branch,
      version: `build-${run.run_number}`,
    }));

    res.json(deployments);
  } catch (error) {
    console.error("GitHub Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

function formatRelativeTime(dateString) {
  const now = new Date();
  const past = new Date(dateString);
  const diffInMs = now - past;
  const diffInMins = Math.floor(diffInMs / 60000);

  if (diffInMins < 60) return `${diffInMins}m ago`;
  return `${Math.floor(diffInMins / 60)}h ago`;
}

app.get("/", (req, res) => {
  res.json({
    status: "Healthy",
    message: "Hello from the DevOps Backend!",
    timestamp: new Date(),
  });
});
app.get("/metrics", async (_req, res) => {
  res.setHeader("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`App listening on port ${PORT}`);
});
