import { useState, useEffect } from "react";

const API_BASE = "http://localhost:5000";

function HealthBar({ label, value, percent, barClassName, textClassName }) {
  const pct = Math.min(Number(percent) || 0, 100);
  return (
    <div className="mb-6 last:mb-0">
      <div className="flex justify-between items-baseline mb-2 text-sm">
        <span className="text-text-secondary">{label}</span>
        <span className={`font-semibold tabular-nums ${textClassName}`}>
          {value}
        </span>
      </div>
      <div className="h-2 rounded-full bg-bg-deep border border-border-subtle overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barClassName}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const HealthPanel = () => {
  const [metrics, setMetrics] = useState({
    cpu: 0,
    mem: 0,
    uptime: "0h 0m",
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/stats`);
        const data = await res.json();

        setMetrics({
          cpu: Number(data.cpuUsage.toFixed(1)),
          mem: Number(data.memoryUsage.toFixed(1)),
          uptime:
            Math.floor(data.uptime / 3600) +
            "h " +
            Math.floor((data.uptime % 3600) / 60) +
            "m",
        });
      } catch (e) {
        console.error("Stats fetch error:", e);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const cpuHigh = metrics.cpu > 80;

  return (
    <div className="max-w-md rounded-xl border border-border-default bg-bg-card/90 backdrop-blur-sm p-6 shadow-soft">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-6">
        Server health
      </h3>

      <HealthBar
        label="CPU usage"
        value={`${metrics.cpu}%`}
        percent={metrics.cpu}
        barClassName={cpuHigh ? "bg-accent-danger" : "bg-brand-secondary"}
        textClassName={cpuHigh ? "text-accent-danger" : "text-brand-secondary"}
      />

      <HealthBar
        label="Memory"
        value={`${metrics.mem}%`}
        percent={metrics.mem}
        barClassName="bg-accent-success"
        textClassName="text-accent-success"
      />

      <div className="mt-8 pt-5 border-t border-border-subtle">
        <div className="text-xs text-text-muted mb-1">System uptime</div>
        <div className="text-lg font-semibold text-text-primary tabular-nums">
          {metrics.uptime}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border-default bg-bg-deep/60 px-4 py-3">
        <div className="text-xs font-medium text-accent-success flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-success shadow-[0_0_8px_rgb(52_211_153_/_.6)]" />
          Metrics endpoint reachable
        </div>
      </div>
    </div>
  );
};

export default HealthPanel;
