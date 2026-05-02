import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

const API_BASE = "http://localhost:5000";

function normalize(hay, needle) {
  if (!needle) return false;
  return hay.toLowerCase().includes(needle.toLowerCase());
}

function runMatches(run, q) {
  const blob = [
    run.id,
    run.runNumber,
    run.commitMsg,
    run.branch,
    run.status,
    run.conclusion,
  ]
    .filter(Boolean)
    .join(" ");
  return normalize(blob, q);
}

function deploymentMatches(dep, q) {
  const blob = [
    dep.id,
    dep.commitMsg,
    dep.env,
    dep.version,
    dep.status,
    dep.time,
  ]
    .filter(Boolean)
    .join(" ");
  return normalize(blob, q);
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const qRaw = searchParams.get("q") || "";
  const q = qRaw.trim();

  const [runs, setRuns] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`${API_BASE}/api/workflow-runs?per_page=100`).then((r) => r.json()),
      fetch(`${API_BASE}/api/deployments`).then((r) => r.json()),
    ])
      .then(([runsData, depData]) => {
        if (cancelled) return;
        setRuns(Array.isArray(runsData) ? runsData : []);
        setDeployments(Array.isArray(depData) ? depData : []);
        if (!Array.isArray(runsData) && runsData?.error) {
          setError(runsData.error);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not reach the backend.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const { matchedRuns, matchedDeployments } = useMemo(() => {
    if (!q) {
      return { matchedRuns: [], matchedDeployments: [] };
    }
    return {
      matchedRuns: runs.filter((r) => runMatches(r, q)),
      matchedDeployments: deployments.filter((d) => deploymentMatches(d, q)),
    };
  }, [runs, deployments, q]);

  const totalHits = matchedRuns.length + matchedDeployments.length;

  if (!q) {
    return (
      <div className="max-w-2xl rounded-xl border border-border-default bg-bg-card/90 p-6 shadow-soft">
        <h1 className="text-lg font-bold text-text-primary mb-2">Search</h1>
        <p className="text-sm text-text-secondary leading-relaxed">
          Use the search field in the header to find workflow runs and recent
          deployments by commit message, branch, run number, or ID.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-text-primary tracking-tight">
          Search results
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Query:{" "}
          <span className="text-brand-primary font-mono text-xs sm:text-sm">
            {qRaw}
          </span>
        </p>
      </div>

      {loading && (
        <p className="text-sm text-text-muted animate-pulse">Loading…</p>
      )}
      {error && (
        <p className="text-sm text-accent-danger border border-accent-danger/30 rounded-lg px-3 py-2 bg-accent-danger/10">
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          <p className="text-sm text-text-secondary mb-4">
            {totalHits === 0
              ? "No matches in workflow runs or recent deployments."
              : `${totalHits} match${totalHits === 1 ? "" : "es"} found.`}
          </p>

          {matchedRuns.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                Workflow runs ({matchedRuns.length})
              </h2>
              <ul className="flex flex-col gap-2">
                {matchedRuns.map((run) => (
                  <li
                    key={run.id}
                    className="rounded-lg border border-border-default bg-bg-deep/40 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {run.commitMsg || "—"}
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        #{run.runNumber} · {run.branch || "—"} ·{" "}
                        <span className="text-text-secondary">{run.status}</span>
                        {run.conclusion
                          ? ` · ${run.conclusion}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Link
                        to={`/logs?run=${run.id}`}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-brand-primary text-bg-deep hover:brightness-110"
                      >
                        View logs
                      </Link>
                      {run.htmlUrl && (
                        <a
                          href={run.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border-default text-text-secondary hover:text-brand-primary"
                        >
                          GitHub
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {matchedDeployments.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                Recent deployments ({matchedDeployments.length})
              </h2>
              <ul className="flex flex-col gap-2">
                {matchedDeployments.map((dep) => (
                  <li
                    key={dep.id}
                    className="rounded-lg border border-border-default bg-bg-deep/40 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {dep.commitMsg || "—"}
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        {dep.version} · {dep.env} · {dep.time} ·{" "}
                        <span
                          className={
                            dep.status === "success"
                              ? "text-accent-success"
                              : dep.status === "pending"
                                ? "text-accent-warning"
                                : "text-accent-danger"
                          }
                        >
                          {dep.status}
                        </span>
                      </p>
                    </div>
                    <Link
                      to={`/logs?run=${dep.id}`}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-border-default text-brand-primary hover:bg-brand-primary/10 shrink-0 self-start sm:self-auto"
                    >
                      Logs
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
