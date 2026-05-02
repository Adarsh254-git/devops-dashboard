import {
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

const API_BASE = "http://localhost:5000";
const POLL_MS = 45000;

const FILTER_BTNS = [
  { id: "all", label: "All", active: "border-brand-primary/50 bg-brand-primary/10 text-brand-primary" },
  { id: "success", label: "Success", active: "border-accent-success/50 bg-accent-success/10 text-accent-success" },
  { id: "failed", label: "Failed", active: "border-accent-danger/50 bg-accent-danger/10 text-accent-danger" },
  { id: "running", label: "In progress", active: "border-accent-warning/50 bg-accent-warning/10 text-accent-warning" },
];

function OutcomeBadge({ run }) {
  const base =
    "text-[0.65rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border ";
  if (run.status !== "completed") {
    return (
      <span
        className={`${base} border-amber-500/40 bg-amber-500/15 text-amber-400`}
      >
        Running
      </span>
    );
  }
  if (run.conclusion === "success") {
    return (
      <span
        className={`${base} border-emerald-500/40 bg-emerald-500/15 text-emerald-400`}
      >
        Success
      </span>
    );
  }
  if (
    run.conclusion === "failure" ||
    ["timed_out", "cancelled", "action_required"].includes(run.conclusion)
  ) {
    return (
      <span
        className={`${base} border-red-500/40 bg-red-500/15 text-red-400`}
      >
        Failed
      </span>
    );
  }
  return (
    <span
      className={`${base} border-border-default bg-bg-elevated text-text-secondary`}
    >
      {run.conclusion || "—"}
    </span>
  );
}

function formatTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

function isFailedRun(run) {
  return (
    run.conclusion === "failure" ||
    ["timed_out", "cancelled", "action_required"].includes(run.conclusion)
  );
}

export default function LogsPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [runs, setRuns] = useState([]);
  const [filter, setFilter] = useState("all");
  const [logModal, setLogModal] = useState(null);
  const [activeRunId, setActiveRunId] = useState(null);

  useEffect(() => {
    const load = () => {
      fetch(`${API_BASE}/api/workflow-runs?per_page=50`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setRuns(data);
          else if (data?.error)
            toast.error(`Runs: ${data.error}`);
        })
        .catch(() => toast.error("Could not load workflow runs."));
    };
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, []);

  const visible = useMemo(() => {
    return runs.filter((run) => {
      if (filter === "all") return true;
      if (filter === "running") return run.status !== "completed";
      if (filter === "success")
        return run.status === "completed" && run.conclusion === "success";
      if (filter === "failed") {
        if (run.status !== "completed") return false;
        return isFailedRun(run);
      }
      return true;
    });
  }, [runs, filter]);

  const fetchLogs = useCallback(async (runId) => {
    setActiveRunId(runId);
    setLogModal({ loading: true });
    try {
      const response = await fetch(
        `${API_BASE}/api/deployments/${runId}/logs`,
      );
      const data = await response.json();
      if (!response.ok) {
        const message = data?.details || data?.error || "Unknown error";
        setLogModal({ error: `Could not load logs.\n\n${message}` });
        toast.error("Log fetch failed.");
        return;
      }
      const full = buildLogsText(data);
      const summary =
        typeof data.summary === "string" && data.summary.trim()
          ? data.summary.trim()
          : (full || "").slice(0, 8000);
      const failed = !!data.summaryMeta?.failedRun;
      setLogModal({
        full: full || "No raw log content returned.",
        summary: summary || "(No digest available.)",
        tab: failed ? "digest" : "full",
        failedRun: failed,
      });
    } catch {
      setLogModal({ error: "Could not reach the backend." });
      toast.error("Network error loading logs.");
    }
  }, []);

  /** Open logs when navigating from search: `/logs?run=<id>` */
  useEffect(() => {
    const runParam = searchParams.get("run");
    if (!runParam || runs.length === 0) return;

    const id = Number(runParam);
    if (!Number.isFinite(id)) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("run");
          return next;
        },
        { replace: true },
      );
      return;
    }

    const match = runs.find((r) => r.id === id);

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("run");
        return next;
      },
      { replace: true },
    );

    if (!match) {
      toast.warn(
        "That run is not in the latest loaded list. Try again after refresh.",
      );
      return;
    }

    const canOpen =
      match.status === "completed" && match.conclusion !== "skipped";
    if (!canOpen) {
      toast.info(
        "Logs are only available for completed runs that are not skipped.",
      );
      return;
    }

    fetchLogs(id);
  }, [runs, searchParams, setSearchParams, fetchLogs]);

  const closeModal = () => {
    setLogModal(null);
    setActiveRunId(null);
  };

  const setLogTab = (tab) => {
    setLogModal((m) => (m && !m.loading && !m.error ? { ...m, tab } : m));
  };

  return (
    <div className="max-w-4xl rounded-xl border border-border-default bg-bg-card/90 backdrop-blur-sm p-6 shadow-soft">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
        GitHub Actions logs
      </h3>
      <p className="text-sm text-text-secondary mb-5 leading-relaxed">
        Recent workflow runs for{" "}
        <code className="text-xs px-1.5 py-0.5 rounded bg-bg-deep border border-border-default text-brand-primary">
          main.yml
        </code>
        . Open any completed run to fetch logs from GitHub.
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        {FILTER_BTNS.map(({ id, label, active }) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
              filter === id
                ? active
                : "border-border-default bg-bg-deep/40 text-text-secondary hover:border-border-strong hover:text-text-primary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {visible.length === 0 ? (
          <p className="text-sm text-text-muted py-4">
            No runs match this filter.
          </p>
        ) : (
          visible.map((run) => {
            const canOpenLogs =
              run.status === "completed" && run.conclusion !== "skipped";
            const dotClass =
              run.status !== "completed"
                ? "bg-accent-warning"
                : run.conclusion === "success"
                  ? "bg-accent-success shadow-[0_0_8px_rgb(52_211_153_/_.45)]"
                  : isFailedRun(run)
                    ? "bg-accent-danger shadow-[0_0_8px_rgb(248_113_113_/_.45)]"
                    : "bg-text-muted";

            return (
              <div
                key={run.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-bg-deep/40 border border-border-subtle hover:border-border-default transition-colors"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-text-primary truncate">
                    {run.commitMsg}
                  </div>
                  <div className="text-xs text-text-secondary mt-0.5">
                    #{run.runNumber} · {run.branch} ·{" "}
                    {formatTime(run.createdAt)}
                  </div>
                </div>
                <OutcomeBadge run={run} />
                {run.htmlUrl && (
                  <a
                    href={run.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-brand-primary hover:underline shrink-0"
                  >
                    GitHub
                  </a>
                )}
                <button
                  type="button"
                  disabled={!canOpenLogs}
                  onClick={() => canOpenLogs && fetchLogs(run.id)}
                  className={`text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg shrink-0 transition-colors ${
                    canOpenLogs
                      ? "bg-brand-primary text-bg-deep hover:brightness-110"
                      : "bg-bg-elevated text-text-muted cursor-not-allowed border border-border-default"
                  }`}
                >
                  View logs
                </button>
              </div>
            );
          })
        )}
      </div>

      {logModal !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={closeModal}
          role="presentation"
        >
          <div
            className="w-full max-w-4xl max-h-[85vh] flex flex-col rounded-xl border border-border-default bg-bg-code shadow-card overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border-default bg-bg-elevated/50">
              <span className="text-sm font-semibold text-text-primary">
                GitHub workflow logs
                {activeRunId != null ? ` · run ${activeRunId}` : ""}
              </span>
              <button
                type="button"
                onClick={closeModal}
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
                  Digest (AI-ready)
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
                {logModal.failedRun ? (
                  <span className="text-[0.65rem] text-accent-danger font-medium">
                    Failed run — digest highlights errors + tail
                  </span>
                ) : null}
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 text-[0.8rem] font-mono text-[#e6edf3] whitespace-pre-wrap break-words min-h-[120px]">
              {logModal.loading
                ? "Downloading logs from GitHub…"
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
}
