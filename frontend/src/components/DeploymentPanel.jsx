import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const DEPLOY_INTERVAL_MS = 30000;
const MAX_DEPLOYMENTS = 20;
const API_BASE = "http://localhost:5000";

function buildLogsText(data) {
  if (data?.logs != null && String(data.logs).trim()) {
    return String(data.logs);
  }
  if (Array.isArray(data?.jobs)) {
    return data.jobs
      .map((j) => {
        const bits = [j.logs, ...(Array.isArray(j.errors) ? j.errors : [])]
          .filter(Boolean)
          .join("\n");
        return `\n========== JOB: ${j.jobName || j.jobId} ==========\n${bits || "(empty)"}`;
      })
      .join("\n");
  }
  return "";
}

function DeploymentRow({ dep, onShowLogs }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-deep/40 border border-border-subtle hover:border-border-default transition-colors">
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${dep.status === "success" ? "bg-accent-success shadow-[0_0_8px_rgb(52_211_153_/_.5)]" : dep.status === "pending" ? "bg-accent-warning" : "bg-accent-danger shadow-[0_0_8px_rgb(248_113_113_/_.45)]"}`}
      />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-text-primary truncate">
          {dep.commitMsg}
        </div>
        <div className="text-xs text-text-secondary mt-0.5">
          {dep.time} · {dep.env}
        </div>
      </div>

      {dep.status === "failure" && (
        <button
          type="button"
          onClick={() => onShowLogs(dep.id)}
          className="text-[0.7rem] font-bold uppercase tracking-wide bg-brand-primary text-bg-deep px-3 py-1.5 rounded-lg hover:brightness-110 transition-[filter]"
        >
          View logs
        </button>
      )}

      <span className="text-[0.7rem] font-semibold px-2 py-1 rounded-md bg-bg-elevated text-text-secondary border border-border-default shrink-0">
        {dep.version}
      </span>
    </div>
  );
}

let lastAlertedId = null;

const DeploymentPanel = () => {
  const [deployments, setDeployments] = useState([]);
  const [logModal, setLogModal] = useState(null);
  const [showFailedOnly, setShowFailedOnly] = useState(false);
  const visibleDeployments = showFailedOnly
    ? deployments.filter((dep) => dep.status === "failure")
    : deployments;

  const fetchLogs = async (runId) => {
    setLogModal({ loading: true });
    try {
      const response = await fetch(
        `${API_BASE}/api/deployments/${runId}/logs`,
      );
      const data = await response.json();

      if (!response.ok) {
        const message = data?.details || data?.error || "Unknown error";
        setLogModal({ error: `Failed to fetch logs.\n\n${message}` });
        toast.error("Could not fetch deployment logs.");
        return;
      }

      const full = buildLogsText(data);
      const summary =
        typeof data.summary === "string" && data.summary.trim()
          ? data.summary.trim()
          : (full || "").slice(0, 8000);
      const failed = !!data.summaryMeta?.failedRun;

      if (!full?.trim()) {
        toast.warn("Logs could not be extracted.");
      }

      setLogModal({
        full: full?.trim() || "Logs could not be extracted.",
        summary: summary || "(No digest available.)",
        tab: failed ? "digest" : "full",
        failedRun: failed,
      });
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      toast.error("Could not connect to log service.");
      setLogModal({ error: "Could not connect to backend log service." });
    }
  };

  const closeLogModal = () => setLogModal(null);

  const setLogTab = (tab) => {
    setLogModal((m) => (m && !m.loading && !m.error ? { ...m, tab } : m));
  };

  useEffect(() => {
    const fetchDeployments = () => {
      fetch(`${API_BASE}/api/deployments`)
        .then((r) => r.json())
        .then((data) => {
          if (!Array.isArray(data)) return;
          setDeployments(data.slice(0, MAX_DEPLOYMENTS));

          const latest = data[0];
          if (
            latest &&
            latest.status === "failure" &&
            latest.id !== lastAlertedId
          ) {
            lastAlertedId = latest.id;
            toast.error(`Deployment Failed — ${latest.commitMsg}`, {
              theme: "colored",
            });
          }
        })
        .catch((err) => console.error("Deployment fetch failed:", err));
    };

    fetchDeployments();
    const id = setInterval(fetchDeployments, DEPLOY_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="max-w-3xl rounded-xl border border-border-default bg-bg-card/90 backdrop-blur-sm p-6 shadow-soft">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
        Recent deployments
      </h3>
      <p className="text-sm text-text-secondary mb-5">
        Latest workflow runs from GitHub Actions.
      </p>

      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowFailedOnly((prev) => !prev)}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
            showFailedOnly
              ? "border-accent-danger/50 bg-accent-danger/10 text-accent-danger"
              : "border-border-default bg-bg-deep/50 text-text-secondary hover:text-text-primary hover:border-border-strong"
          }`}
        >
          {showFailedOnly ? "Showing failed only" : "Show failed only"}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {visibleDeployments.length > 0 ? (
          visibleDeployments.map((dep, i) => (
            <DeploymentRow key={dep.id ?? i} dep={dep} onShowLogs={fetchLogs} />
          ))
        ) : (
          <p className="text-sm text-text-muted py-4">
            {showFailedOnly
              ? "No failed deployments in the latest runs."
              : "No recent deployments found."}
          </p>
        )}
      </div>

      {logModal !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={closeLogModal}
          role="presentation"
        >
          <div
            className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-xl border border-border-default bg-bg-code shadow-card overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border-default bg-bg-elevated/50">
              <span className="text-sm font-semibold text-text-primary">
                Deployment logs
              </span>
              <button
                type="button"
                onClick={closeLogModal}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            {!logModal.loading && !logModal.error && logModal.summary && (
              <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-border-default bg-bg-deep/30">
                <span className="text-xs text-text-muted">View:</span>
                <button
                  type="button"
                  onClick={() => setLogTab("digest")}
                  className={`text-xs font-bold px-3 py-1 rounded-lg border transition-colors ${
                    logModal.tab === "digest"
                      ? "border-brand-primary bg-brand-primary/15 text-brand-primary"
                      : "border-border-default text-text-secondary hover:border-border-strong"
                  }`}
                >
                  Digest
                </button>
                <button
                  type="button"
                  onClick={() => setLogTab("full")}
                  className={`text-xs font-bold px-3 py-1 rounded-lg border transition-colors ${
                    logModal.tab === "full"
                      ? "border-brand-primary bg-brand-primary/15 text-brand-primary"
                      : "border-border-default text-text-secondary hover:border-border-strong"
                  }`}
                >
                  Full log
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 text-sm font-mono text-[#e6edf3] whitespace-pre-wrap break-words min-h-[120px]">
              {logModal.loading
                ? "Fetching logs from GitHub…"
                : logModal.error
                  ? logModal.error
                  : logModal.tab === "digest"
                    ? logModal.summary
                    : logModal.full}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeploymentPanel;
