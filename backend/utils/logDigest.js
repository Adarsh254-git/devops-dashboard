const AdmZip = require("adm-zip");

function extractZipLogsFromBuffer(buffer) {
  const zip = new AdmZip(Buffer.from(buffer));
  const zipEntries = zip.getEntries();

  const logEntries = zipEntries
    .filter((entry) => !entry.isDirectory && /\.txt$/i.test(entry.entryName))
    .sort((a, b) => a.entryName.localeCompare(b.entryName));

  let fullLog = "";
  logEntries.forEach((entry) => {
    fullLog += `\n--- STEP: ${entry.entryName.split("/").pop()} ---\n`;
    fullLog += entry.getData().toString("utf8");
  });

  return fullLog;
}

function isFailureConclusion(conclusion) {
  return ["failure", "timed_out", "cancelled", "action_required"].includes(
    conclusion,
  );
}

function extractErrors(logText) {
  return logText.split("\n").filter((line) => {
    const l = line.toLowerCase();
    return (
      l.includes("error") || l.includes("failed") || l.includes("exception")
    );
  });
}

function stripAnsi(text) {
  if (!text) return "";
  return String(text).replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, "");
}

function normalizeLineKey(line) {
  return stripAnsi(line)
    .replace(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z?\s*/, "")
    .replace(/^\d{2}:\d{2}:\d{2}(?:\.\d+)?\s*/, "")
    .replace(/^##\[(?:notice|warning|debug)\]\s*/i, "")
    .trim()
    .slice(0, 220);
}

function summarizeJobLog(jobName, rawLog, extraLines = []) {
  const merged = [
    rawLog || "",
    Array.isArray(extraLines) ? extraLines.join("\n") : "",
  ].join("\n");

  const text = stripAnsi(merged);
  const lines = text.split(/\n/);

  const highlightRe =
    /##\[error\]| error[: |[:\]]| ERROR |(^|\s)(failed|failure)(\s|$)|\bFAILED\b|\bfatal\b|\bFATAL\b|\bexception\b|\btraceback\b|npm ERR!|pnpm ERR!|yarn error|ELIFECYCLE|exit code [1-9]\d*|exited with (?!0)\d+|command failed|non-zero exit|syntaxerror|cannot find module|\bENOENT\b|EADDRINUSE|AssertionError|Test Files.*\bfailed\b|\bFAIL\s+/i;

  const skipRe =
    /^\s*$|^##\[debug\]|^##\[group\]|^##\[endgroup\]|^Adding repo|^debconf:|^\(Reading database|^\+[\s]*$/i;

  const picked = [];
  const seen = new Set();

  for (const line of lines) {
    const t = line.trim();
    if (t.length < 5 || t.length > 700) continue;
    if (skipRe.test(t)) continue;
    if (!highlightRe.test(t)) continue;

    const key = normalizeLineKey(t);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    picked.push(t.slice(0, 450));
    if (picked.length >= 22) break;
  }

  const tail = lines
    .slice(-40)
    .map((l) => stripAnsi(l).trimEnd())
    .filter((l) => l.length > 0);

  let block = `▸ Job: ${jobName}\n`;
  if (picked.length) {
    block += "What broke (signal lines):\n";
    picked.forEach((p, i) => {
      block += `  ${i + 1}. ${p}\n`;
    });
  } else {
    block +=
      "No obvious error keywords matched; use the tail to find the last command and exit code.\n";
  }

  const tailChunk = tail.slice(-22).join("\n");
  const tailMax = 2800;
  block += "\nTail (last lines for context):\n";
  block +=
    tailChunk.length > tailMax
      ? `${tailChunk.slice(-tailMax)}\n… (tail truncated)`
      : tailChunk || "(empty)";

  return block;
}

function buildFailureDigest(runConclusion, filteredJobs) {
  const header = [
    `Workflow digest`,
    `Conclusion: ${runConclusion}`,
    `Jobs in this digest: ${filteredJobs.map((j) => j.jobName || j.jobId).join(", ")}`,
    "",
  ].join("\n");

  const sections = filteredJobs.map((j) =>
    summarizeJobLog(
      j.jobName || String(j.jobId),
      j.logs,
      j.errors,
    ),
  );

  let body = `${header}${sections.join("\n\n────────────\n\n")}`;
  const max = 7500;
  if (body.length > max) {
    body = `${body.slice(0, max)}\n\n… (digest truncated for size)`;
  }
  return body;
}

module.exports = {
  extractZipLogsFromBuffer,
  isFailureConclusion,
  extractErrors,
  summarizeJobLog,
  buildFailureDigest,
};
