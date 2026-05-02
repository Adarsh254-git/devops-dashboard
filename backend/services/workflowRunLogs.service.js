const axios = require("axios");
const { octokit, githubHeaders } = require("../config/octokit");
const {
  extractZipLogsFromBuffer,
  extractErrors,
  isFailureConclusion,
  buildFailureDigest,
} = require("../utils/logDigest");

async function listAllJobsForWorkflowRun(owner, repo, run_id) {
  const jobs = [];
  for (let page = 1; page <= 20; page++) {
    const res = await octokit.actions.listJobsForWorkflowRun({
      owner,
      repo,
      run_id,
      per_page: 100,
      page,
    });
    const batch = res.data.jobs || [];
    jobs.push(...batch);
    if (batch.length < 100) break;
  }
  return jobs;
}

function jobLogsDownloadUrl(owner, repo, job) {
  if (job.logs_url) return job.logs_url;
  return `https://api.github.com/repos/${owner}/${repo}/actions/jobs/${job.id}/logs`;
}

async function fetchJobLogPayload(owner, repo, job) {
  const logsUrl = jobLogsDownloadUrl(owner, repo, job);

  try {
    const response = await axios({
      method: "get",
      url: logsUrl,
      headers: githubHeaders,
      responseType: "arraybuffer",
      maxRedirects: 10,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    if (response.status < 200 || response.status >= 400) {
      throw new Error(
        `GitHub returned HTTP ${response.status} for job logs`,
      );
    }

    let logText = "";

    try {
      logText = extractZipLogsFromBuffer(response.data);
    } catch {
      logText = Buffer.from(response.data).toString("utf8");
    }

    return {
      jobId: job.id,
      jobName: job.name,
      status: job.conclusion,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      duration: new Date(job.completed_at) - new Date(job.started_at),
      logs: logText.slice(0, 20000),
      errors: extractErrors(logText),
    };
  } catch (err) {
    return {
      jobId: job.id,
      jobName: job.name,
      status: "error",
      logs: "",
      errors: [`Failed to fetch logs: ${err.message}`],
    };
  }
}

function combineJobLogsText(filteredJobs) {
  let logs = "";
  for (const j of filteredJobs) {
    const chunk = (j.logs && String(j.logs).trim()) || "";
    logs += `\n========== JOB: ${j.jobName || j.jobId} ==========\n`;
    logs += chunk || "(No log text captured for this job.)";
    if (j.errors?.length) {
      logs += `\n--- Highlighted lines ---\n${j.errors.join("\n")}`;
    }
  }
  return logs;
}

/**
 * Fetches workflow run logs payload for API response.
 * @param {string} owner
 * @param {string} repo
 * @param {number} runNumericId
 */
async function buildLogsResponse(owner, repo, runNumericId) {
  const runResponse = await octokit.actions.getWorkflowRun({
    owner,
    repo,
    run_id: runNumericId,
  });

  const run = runResponse.data;

  if (run.status !== "completed") {
    const err = new Error("Logs available only after completion");
    err.status = 400;
    err.responseBody = {
      error: "Logs available only after completion",
      status: run.status,
    };
    throw err;
  }

  const jobs = await listAllJobsForWorkflowRun(owner, repo, runNumericId);

  if (!jobs.length) {
    const err = new Error("No workflow jobs returned by GitHub");
    err.status = 404;
    err.responseBody = {
      error: "No workflow jobs returned by GitHub",
      details:
        "The run exists but no jobs were listed. Check token permissions (Actions: Read) and that the run belongs to this repository.",
    };
    throw err;
  }

  const failedJobs = jobs.filter((job) =>
    isFailureConclusion(job.conclusion),
  );

  const targetJobs = failedJobs.length ? failedJobs : jobs;

  const jobLogs = await Promise.all(
    targetJobs.map((job) => fetchJobLogPayload(owner, repo, job)),
  );

  const filteredJobs = jobLogs.slice().sort((a, b) => {
    const pri = (s) =>
      s === "failure" ? 0 : s === "error" ? 1 : 2;
    return pri(a.status) - pri(b.status);
  });

  if (!filteredJobs.length) {
    const err = new Error(
      "Could not resolve any job log payloads",
    );
    err.status = 502;
    err.responseBody = {
      error: "Could not resolve any job log payloads",
      details:
        "GitHub listed jobs but none produced log content. Verify Actions log retention and token access.",
    };
    throw err;
  }

  const logs = combineJobLogsText(filteredJobs);
  const runFailed = isFailureConclusion(run.conclusion);
  const summary = runFailed
    ? buildFailureDigest(run.conclusion, filteredJobs)
    : `Run completed successfully (${run.conclusion}). Use “Full log” if you need raw CI output for auditing.`;

  return {
    logs,
    summary,
    summaryMeta: {
      failedRun: runFailed,
      fullApproxChars: logs.length,
      summaryApproxChars: summary.length,
    },
    runId: runNumericId,
    runStatus: run.conclusion,
    totalJobs: filteredJobs.length,
    jobs: filteredJobs,
  };
}

module.exports = {
  buildLogsResponse,
  listAllJobsForWorkflowRun,
  jobLogsDownloadUrl,
};
