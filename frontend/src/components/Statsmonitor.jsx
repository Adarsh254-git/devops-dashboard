import { useEffect, useRef, useState } from "react";

const WINDOW = 30;
const INTERVAL_MS = 1000;
const API_BASE = "http://localhost:5000";

const WaveChart = ({ data, color, unit, label }) => {
  const canvasRef = useRef(null);
  const latest = [...data].reverse().find((v) => v != null) ?? 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const W = canvas.width;
    const H = canvas.height;
    const PAD = { left: 36, right: 8, top: 8, bottom: 8 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px Inter, system-ui, sans-serif";
    ctx.textAlign = "right";
    [0, 25, 50, 75, 100].forEach((v) => {
      const y = PAD.top + chartH - (v / 100) * chartH;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + chartW, y);
      ctx.stroke();
      ctx.fillText(`${v}${unit}`, PAD.left - 4, y + 3);
    });

    const pts = data.map((d, i) => ({
      x: PAD.left + (i / (WINDOW - 1)) * chartW,
      y:
        d == null
          ? null
          : PAD.top + chartH - (Math.min(100, Math.max(0, d)) / 100) * chartH,
    }));

    const first = pts.find((p) => p.y != null);
    const last = [...pts].reverse().find((p) => p.y != null);
    if (!first || !last) return;

    const grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + chartH);
    grad.addColorStop(0, color + "44");
    grad.addColorStop(1, color + "00");

    ctx.beginPath();
    let started = false;
    pts.forEach((p) => {
      if (p.y == null) {
        started = false;
        return;
      }
      if (!started) {
        ctx.moveTo(p.x, p.y);
        started = true;
      } else ctx.lineTo(p.x, p.y);
    });
    ctx.lineTo(last.x, PAD.top + chartH);
    ctx.lineTo(first.x, PAD.top + chartH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    started = false;
    pts.forEach((p) => {
      if (p.y == null) {
        started = false;
        return;
      }
      if (!started) {
        ctx.moveTo(p.x, p.y);
        started = true;
      } else ctx.lineTo(p.x, p.y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "#f8fafc";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [data, color, unit]);

  return (
    <div className="rounded-xl border border-border-default bg-bg-card/90 backdrop-blur-sm p-5 shadow-soft">
      <div className="flex justify-between items-baseline mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {label}
        </h3>
        <span className="text-xl font-bold tabular-nums" style={{ color }}>
          {latest.toFixed(1)}
          {unit}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={560}
        height={180}
        className="w-full h-auto block rounded-lg border border-border-subtle"
      />
    </div>
  );
};

const StatsMonitor = ({ onStatusChange }) => {
  const [cpu, setCpu] = useState(Array(WINDOW).fill(null));
  const [mem, setMem] = useState(Array(WINDOW).fill(null));

  useEffect(() => {
    const fetchStats = () => {
      fetch(`${API_BASE}/api/stats`)
        .then((r) => r.json())
        .then((d) => {
          onStatusChange?.("Online");
          setCpu((prev) => [...prev.slice(1), Number(d.cpuUsage) || null]);
          setMem((prev) => [...prev.slice(1), Number(d.memoryUsage) || null]);
        })
        .catch(() => onStatusChange?.("Offline"));
    };

    fetchStats();
    const id = setInterval(fetchStats, INTERVAL_MS);
    return () => clearInterval(id);
  }, [onStatusChange]);

  return (
    <div className="flex flex-col gap-5">
      <WaveChart data={cpu} color="#818cf8" unit="%" label="CPU usage" />
      <WaveChart data={mem} color="#34d399" unit="%" label="Memory usage" />
    </div>
  );
};

export default StatsMonitor;
