require("dotenv").config();
const express = require("express");
const cors = require("cors");
const os = require("os");
const { Octokit } = require("@octokit/rest");
const promClient = require("prom-client");
const axios = require("axios");
const AdmZip = require("adm-zip");

const osUtils = require("os-utils");

const app = express();
const PORT = Number(process.env.PORT || 5000);
app.use(cors());
app.use(express.json());

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const githubHeaders = process.env.GITHUB_TOKEN
  ? {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    }
  : {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

function extractZipLogsFromBuffer(buffer) {
  const zip = new AdmZip(Buffer.from(buffer));
  const zipEntries = zip.getEntries();

  const logEntries = zipEntries
    .filter((entry) => !entry.isDirectory && entry.entryName.endsWith(".txt"))
    .sort((a, b) => a.entryName.localeCompare(b.entryName));

  let fullLog = "";
  logEntries.forEach((entry) => {
    fullLog += `\n--- STEP: ${entry.entryName.split("/").pop()} ---\n`;
    fullLog += entry.getData().toString("utf8");
  });

  return fullLog;
}

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

// backend/server.js

app.get("/api/deployments/:runId/logs", async (req, res) => {
  const { runId } = req.params;
  console.log(`>>> Processing logs for Run ID: ${runId}`);

  try {
    // 1) Primary path: workflow-level logs archive
    const response = await octokit.actions.downloadWorkflowRunLogs({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      run_id: runId,
    });

    // 2) Download ZIP with Axios
    const zipResponse = await axios({
      method: "get",
      url: response.url,
      responseType: "arraybuffer",
    });

    const fullLog = extractZipLogsFromBuffer(zipResponse.data);

    if (!fullLog) {
      return res
        .status(404)
        .json({ error: "No text logs found in the archive." });
    }

    res.json({ logs: fullLog });
  } catch (err) {
    // Fallback path: try per-job logs if run-level endpoint is unavailable.
    try {
      const jobsResponse = await octokit.actions.listJobsForWorkflowRun({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        run_id: Number(runId),
        per_page: 100,
      });

      const jobs = jobsResponse.data.jobs || [];
      let combinedLogs = "";

      for (const job of jobs) {
        if (!job.logs_url) continue;

        const jobLogResponse = await axios({
          method: "get",
          url: job.logs_url,
          headers: githubHeaders,
          responseType: "arraybuffer",
          maxRedirects: 5,
          validateStatus: (status) => status >= 200 && status < 400,
        });

        let jobLogText = "";
        try {
          jobLogText = extractZipLogsFromBuffer(jobLogResponse.data);
        } catch (_zipErr) {
          jobLogText = Buffer.from(jobLogResponse.data).toString("utf8");
        }

        if (jobLogText && jobLogText.trim()) {
          combinedLogs += `\n========== JOB: ${job.name || job.id} ==========\n`;
          combinedLogs += jobLogText;
        }
      }

      if (combinedLogs.trim()) {
        return res.json({ logs: combinedLogs });
      }
    } catch (fallbackErr) {
      console.error("Per-job log fallback failed:", fallbackErr.message);
    }

    const status = err.status || 500;
    const details =
      status === 404
        ? "GitHub returned 404 for this run logs endpoint. This is usually caused by missing token permissions (Actions: Read), inaccessible repository scope, or logs already expired."
        : err.message;

    console.error("CRITICAL BACKEND ERROR:", err.message);
    res
      .status(status >= 400 ? status : 500)
      .json({ error: "Failed to process logs", details });
  }
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
