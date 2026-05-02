import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  MdErrorOutline,
  MdWarningAmber,
  MdOutlineHourglassTop,
  MdClose,
  MdOpenInNew,
} from "react-icons/md";

const API_BASE = "http://localhost:5000";
const POLL_MS = 30000;
const DISMISSED_KEY = "devops-dashboard-dismissed-alerts";

function loadDismissed() {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr.map(Number).filter(Number.isFinite) : []);
  } catch {
    return new Set();
  }
}

function saveDismissed(set) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]));
}

function severityIcon(kind) {
  if (kind === "critical")
    return <MdErrorOutline className="text-accent-danger shrink-0" size={22} />;
  if (kind === "warning")
    return <MdWarningAmber className="text-accent-warning shrink-0" size={22} />;
  return (
    <MdOutlineHourglassTop className="text-brand-primary shrink-0" size={22} />
  );
}

function AlertCard({ run, kind, onDismiss }) {
  const border =
    kind === "critical"
      ? "border-accent-danger/35 bg-accent-danger/[0.06]"
      : kind === "warning"
        ? "border-accent-warning/35 bg-accent-warning/[0.06]"
        : "border-brand-primary/25 bg-brand-primary/[0.06]";

  const canLogs =
    run.status === "completed" && run.conclusion !== "skipped";

  return (
    <article
      className={`rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-start gap-3 ${border}`}
    >
      <div className="mt-0.5">{severityIcon(kind)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary line-clamp-2">
          {run.commitMsg?.split("\n")[0] || "Workflow run"}
        </p>
        <p className="text-xs text-text-muted mt-1">
          Run #{run.runNumber} · {run.branch || "—"} ·{" "}
          <span className="text-text-secondary">{run.status}</span>
          {run.conclusion ? ` · ${run.conclusion}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        {canLogs && (
          <Link
            to={`/logs?run=${run.id}`}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-brand-primary text-bg-deep hover:brightness-110 inline-flex items-center gap-1"
          >
            Logs
          </Link>
        )}
        {run.htmlUrl && (
          <a
            href={run.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border-default text-text-secondary hover:text-brand-primary inline-flex items-center gap-1"
          >
            GitHub <MdOpenInNew size={14} />
          </a>
        )}
        <button
          type="button"
          onClick={() => onDismiss(run.id)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border-default text-text-muted hover:text-text-primary hover:bg-bg-elevated inline-flex items-center gap-1"
          title="Hide until you clear dismissed list"
        >
          <MdClose size={16} aria-hidden />
          Dismiss
        </button>
      </div>
    </article>
  );
}

export default function AlertsPanel() {
  const [runs, setRuns] = useState([]);
  const [dismissed, setDismissed] = useState(loadDismissed);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    fetch(`${API_BASE}/api/workflow-runs?per_page=75`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRuns(data);
        else if (data?.error) toast.error(data.error);
      })
      .catch(() => toast.error("Could not load alerts."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const dismiss = useCallback((runId) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(runId);
      saveDismissed(next);
      return next;
    });
    toast.info("Alert dismissed for this browser.");
  }, []);

  const clearAllDismissed = useCallback(() => {
    setDismissed(new Set());
    localStorage.removeItem(DISMISSED_KEY);
    toast.success("Dismissed alerts cleared.");
  }, []);

  const { critical, warning, watching } = useMemo(() => {
    const active = runs.filter((r) => !dismissed.has(r.id));

    const critical = active.filter(
      (r) =>
        r.status === "completed" &&
        (r.conclusion === "failure" || r.conclusion === "timed_out"),
    );

    const warning = active.filter(
      (r) =>
        r.status === "completed" &&
        ["cancelled", "action_required"].includes(r.conclusion),
    );

    const watching = active.filter(
      (r) => r.status === "queued" || r.status === "in_progress",
    );

    return { critical, warning, watching };
  }, [runs, dismissed]);

  const totalOpen = critical.length + warning.length + watching.length;

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary tracking-tight">
          Alerts
        </h1>
        <p className="text-sm text-text-secondary mt-2 leading-relaxed">
          Derived from your GitHub Actions runs: failures, timeouts, and runs
          that need attention. Dismissals are stored only in{" "}
          <strong className="text-text-primary font-medium">this browser</strong>
          .
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <div className="rounded-lg border border-border-default bg-bg-card/80 px-4 py-2 text-center min-w-[100px]">
          <div className="text-2xl font-bold text-accent-danger tabular-nums">
            {critical.length}
          </div>
          <div className="text-[0.65rem] uppercase tracking-wide text-text-muted font-semibold">
            Critical
          </div>
        </div>
        <div className="rounded-lg border border-border-default bg-bg-card/80 px-4 py-2 text-center min-w-[100px]">
          <div className="text-2xl font-bold text-accent-warning tabular-nums">
            {warning.length}
          </div>
          <div className="text-[0.65rem] uppercase tracking-wide text-text-muted font-semibold">
            Warning
          </div>
        </div>
        <div className="rounded-lg border border-border-default bg-bg-card/80 px-4 py-2 text-center min-w-[100px]">
          <div className="text-2xl font-bold text-brand-primary tabular-nums">
            {watching.length}
          </div>
          <div className="text-[0.65rem] uppercase tracking-wide text-text-muted font-semibold">
            In progress
          </div>
        </div>
        {dismissed.size > 0 && (
          <button
            type="button"
            onClick={clearAllDismissed}
            className="self-end text-xs font-semibold px-3 py-2 rounded-lg border border-border-default text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
          >
            Clear dismissed ({dismissed.size})
          </button>
        )}
      </div>

      {loading && (
        <p className="text-sm text-text-muted animate-pulse">Loading alerts…</p>
      )}

      {!loading && totalOpen === 0 && (
        <div className="rounded-xl border border-border-default bg-bg-card/60 px-6 py-10 text-center">
          <p className="text-text-primary font-medium mb-1">All clear</p>
          <p className="text-sm text-text-secondary">
            No open alerts in the latest workflow runs
            {dismissed.size > 0 ? " (after dismissals)." : "."}
          </p>
          <Link
            to="/dashboard"
            className="inline-block mt-4 text-sm font-semibold text-brand-primary hover:underline"
          >
            Back to dashboard
          </Link>
        </div>
      )}

      {!loading && critical.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-accent-danger mb-3 flex items-center gap-2">
            <MdErrorOutline size={16} />
            Critical — failed or timed out
          </h2>
          <div className="flex flex-col gap-3">
            {critical.map((run) => (
              <AlertCard key={run.id} run={run} kind="critical" onDismiss={dismiss} />
            ))}
          </div>
        </section>
      )}

      {!loading && warning.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-accent-warning mb-3 flex items-center gap-2">
            <MdWarningAmber size={16} />
            Warning — cancelled or needs action
          </h2>
          <div className="flex flex-col gap-3">
            {warning.map((run) => (
              <AlertCard key={run.id} run={run} kind="warning" onDismiss={dismiss} />
            ))}
          </div>
        </section>
      )}

      {!loading && watching.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-primary mb-3 flex items-center gap-2">
            <MdOutlineHourglassTop size={16} />
            Watching — queued or running
          </h2>
          <div className="flex flex-col gap-3">
            {watching.map((run) => (
              <AlertCard key={run.id} run={run} kind="watching" onDismiss={dismiss} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
