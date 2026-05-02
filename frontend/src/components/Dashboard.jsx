import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_BASE = "http://localhost:5000";
const RUNS_POLL_MS = 25000;
const STATS_POLL_MS = 1000;
const CHART_POINTS = 36;

const FAILED_CONCLUSIONS = new Set([
  "failure",
  "timed_out",
  "cancelled",
  "action_required",
]);

function formatClock(ts) {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function StatCard({ label, value, hint, borderAccent }) {
  return (
    <div
      className={`flex-1 min-w-[160px] rounded-xl border border-border-default bg-bg-card/90 backdrop-blur-sm p-5 shadow-soft border-t-[3px] ${borderAccent}`}
    >
      <div className="text-[0.7rem] font-bold uppercase tracking-wider text-text-muted mb-2">
        {label}
      </div>
      <div className="text-3xl font-extrabold text-text-primary tabular-nums">
        {value}
      </div>
      {hint ? (
        <p className="text-xs text-text-secondary mt-2 leading-snug">{hint}</p>
      ) : null}
    </div>
  );
}

export default function Dashboard() {
  const [runs, setRuns] = useState([]);
  const [runsError, setRunsError] = useState(false);
  const [healthOk, setHealthOk] = useState(null);
  const [series, setSeries] = useState([]);

  useEffect(() => {
    const loadRuns = () => {
      fetch(`${API_BASE}/api/workflow-runs?per_page=50`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setRuns(data);
            setRunsError(false);
          } else {
            setRunsError(true);
          }
        })
        .catch(() => setRunsError(true));
    };
    loadRuns();
    const id = setInterval(loadRuns, RUNS_POLL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const ping = async () => {
      try {
        const [h, s] = await Promise.all([
          fetch(`${API_BASE}/health`),
          fetch(`${API_BASE}/api/stats`),
        ]);
        setHealthOk(h.ok && s.ok);
      } catch {
        setHealthOk(false);
      }
    };
    ping();
    const id = setInterval(ping, 8000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const tick = () => {
      fetch(`${API_BASE}/api/stats`)
        .then((r) => r.json())
        .then((d) => {
          const ts = Date.now();
          const cpu = Number(d.cpuUsage);
          const mem = Number(d.memoryUsage);
          setSeries((prev) => {
            const next = [
              ...prev,
              {
                t: ts,
                label: formatClock(ts),
                cpu: Number.isFinite(cpu) ? cpu : null,
                mem: Number.isFinite(mem) ? mem : null,
              },
            ];
            return next.slice(-CHART_POINTS);
          });
        })
        .catch(() => {});
    };
    tick();
    const id = setInterval(tick, STATS_POLL_MS);
    return () => clearInterval(id);
  }, []);

  const metrics = useMemo(() => {
    const deploymentCount = runs.length;
    const alertsCount = runs.filter(
      (r) => r.status === "queued" || r.status === "in_progress",
    ).length;
    const failedLogsCount = runs.filter(
      (r) =>
        r.status === "completed" &&
        FAILED_CONCLUSIONS.has(r.conclusion),
    ).length;
    const successCount = runs.filter(
      (r) => r.status === "completed" && r.conclusion === "success",
    ).length;
    return {
      deploymentCount,
      alertsCount,
      failedLogsCount,
      successCount,
    };
  }, [runs]);

  const chartTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const row = payload[0]?.payload;
    return (
      <div className="rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-xs shadow-soft">
        <div className="text-text-muted mb-1">{row?.label}</div>
        {payload.map((p) => (
          <div
            key={p.dataKey}
            style={{ color: p.color }}
            className="font-semibold"
          >
            {p.name}:{" "}
            {typeof p.value === "number" ? `${p.value.toFixed(1)}%` : "—"}
          </div>
        ))}
      </div>
    );
  };

  const axisStroke = "#475569";
  const axisTick = { fill: "#94a3b8", fontSize: 10 };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary mb-2">
          Dashboard
        </h2>
        <p className="text-sm text-text-secondary max-w-2xl leading-relaxed">
          Summary from GitHub Actions runs (latest sample) and live server
          metrics.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <StatCard
          label="Deployments tracked"
          value={runsError ? "—" : metrics.deploymentCount}
          hint="Runs loaded from workflow history"
          borderAccent="border-t-sky-400"
        />
        <StatCard
          label="Alerts (active)"
          value={runsError ? "—" : metrics.alertsCount}
          hint="Queued or in-progress runs"
          borderAccent="border-t-amber-400"
        />
        <StatCard
          label="Failed builds"
          value={runsError ? "—" : metrics.failedLogsCount}
          hint={`${metrics.successCount} succeeded in sample`}
          borderAccent="border-t-red-400"
        />
        <StatCard
          label="Server health"
          value={
            healthOk === null ? "…" : healthOk ? "Healthy" : "Unreachable"
          }
          hint={
            healthOk === null
              ? "Checking API…"
              : healthOk
                ? "Health + stats endpoints OK"
                : "Check backend / Docker"
          }
          borderAccent={
            healthOk === null
              ? "border-t-slate-500"
              : healthOk
                ? "border-t-emerald-400"
                : "border-t-red-400"
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border-default bg-bg-card/90 backdrop-blur-sm p-6 shadow-soft">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4">
            CPU usage
          </h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="cpuFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="label"
                  interval="preserveStartEnd"
                  minTickGap={28}
                  stroke={axisStroke}
                  tick={axisTick}
                  tickLine={false}
                  axisLine={{ stroke: "#334155" }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  width={40}
                  stroke={axisStroke}
                  tick={axisTick}
                  tickLine={false}
                  axisLine={{ stroke: "#334155" }}
                />
                <Tooltip content={chartTooltip} />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  name="CPU"
                  stroke="#818cf8"
                  strokeWidth={2}
                  fill="url(#cpuFill)"
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border-default bg-bg-card/90 backdrop-blur-sm p-6 shadow-soft">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4">
            Memory usage
          </h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="memFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="label"
                  interval="preserveStartEnd"
                  minTickGap={28}
                  stroke={axisStroke}
                  tick={axisTick}
                  tickLine={false}
                  axisLine={{ stroke: "#334155" }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  width={40}
                  stroke={axisStroke}
                  tick={axisTick}
                  tickLine={false}
                  axisLine={{ stroke: "#334155" }}
                />
                <Tooltip content={chartTooltip} />
                <Area
                  type="monotone"
                  dataKey="mem"
                  name="Memory"
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="url(#memFill)"
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
