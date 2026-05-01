import React, { useEffect, useRef, useState } from "react";
import { cardStyle, cardTitleStyle } from "./Styles";

const WINDOW = 30;
const INTERVAL_MS = 1000;

// ── Single Canvas Wave Chart ───────────────────────────────────────────────────
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
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // Grid + Y-axis labels
    ctx.strokeStyle = "#f1f5f9";
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

    // Map data → canvas coords
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

    // Gradient fill
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

    // Stroke line
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

    // Latest dot
    ctx.beginPath();
    ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [data, color, unit]);

  return (
    <div style={cardStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 12,
        }}
      >
        <h3 style={cardTitleStyle}>{label}</h3>
        <span style={{ fontSize: "1.4rem", fontWeight: 700, color }}>
          {latest.toFixed(1)}
          {unit}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={560}
        height={180}
        style={{ width: "100%", height: "auto", display: "block" }}
      />
    </div>
  );
};

// ── StatsMonitor ──────────────────────────────────────────────────────────────
/**
 * Props:
 *   onStatusChange(status: "Online" | "Offline" | "Connecting...") – optional callback
 */
const StatsMonitor = ({ onStatusChange }) => {
  const [cpu, setCpu] = useState(Array(WINDOW).fill(null));
  const [mem, setMem] = useState(Array(WINDOW).fill(null));
  const tickRef = useRef(WINDOW);

  useEffect(() => {
    const fetchStats = () => {
      fetch("http://localhost:5000/api/stats")
        .then((r) => r.json())
        .then((d) => {
          onStatusChange?.("Online");
          setCpu((prev) => [...prev.slice(1), Number(d.cpuUsage) || null]);
          setMem((prev) => [...prev.slice(1), Number(d.memoryUsage) || null]);
          tickRef.current++;
        })
        .catch(() => onStatusChange?.("Offline"));
    };

    fetchStats();
    const id = setInterval(fetchStats, INTERVAL_MS);
    return () => clearInterval(id);
  }, [onStatusChange]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <WaveChart data={cpu} color="#6366f1" unit="%" label="CPU Usage" />
      <WaveChart data={mem} color="#10b981" unit="%" label="Memory Usage" />
    </div>
  );
};

export default StatsMonitor;
