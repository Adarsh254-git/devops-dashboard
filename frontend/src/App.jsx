import React, { useEffect, useState, useRef } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const WINDOW = 30;
const INTERVAL_MS = 1000;

const createEmptyHistory = () =>
  Array.from({ length: WINDOW }, (_, i) => ({
    timestamp: i,
    cpuUsage: 0,
    memoryUsage: 0,
  }));

const App = () => {
  const [history, setHistory] = useState(createEmptyHistory);
  const [status, setStatus] = useState("Connecting...");
  const [deployments, setDeployments] = useState([]);
  const tickRef = useRef(WINDOW);

  // Fetch Deployments
  useEffect(() => {
    const fetchDeployData = () => {
      fetch("http://localhost:5000/api/deployments")
        .then((res) => res.json())
        .then((data) => setDeployments(data.slice(0, 5)))
        .catch((err) => console.error("Deployment fetch failed", err));
    };

    fetchDeployData();
    const interval = setInterval(fetchDeployData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Stats
  useEffect(() => {
    const fetchData = () => {
      fetch("http://localhost:5000/api/stats")
        .then((res) => res.json())
        .then((newData) => {
          setStatus("Online");
          setHistory((prev) => {
            const next = [
              ...prev.slice(1),
              {
                ...newData,
                timestamp: tickRef.current++,
                cpuUsage: Number(newData.cpuUsage) || 0,
                memoryUsage: Number(newData.memoryUsage) || 0,
              },
            ];
            return next;
          });
        })
        .catch(() => setStatus("Offline"));
    };

    const interval = setInterval(fetchData, INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const DeploymentCard = ({ deployments }) => (
    <div style={cardStyle}>
      <h3 style={cardTitleStyle}>Recent Deployments</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {deployments.length > 0 ? (
          deployments.map((dep, index) => (
            <div key={index} style={deploymentRowStyle}>
              <div
                style={{
                  ...statusDot,
                  backgroundColor:
                    dep.status === "success" ? "#4caf50" : "#f44336",
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    color: "#1e293b",
                  }}
                >
                  {dep.commitMsg}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                  {dep.time} • {dep.env}
                </div>
              </div>
              <span style={badgeStyle}>{dep.version}</span>
            </div>
          ))
        ) : (
          <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            No recent deployments found.
          </div>
        )}
      </div>
    </div>
  );

  const MonitoringCard = ({ title, dataKey, color, data, unit }) => (
    <div style={cardStyle}>
      <h3 style={cardTitleStyle}>{title}</h3>
      <div style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id={`color${dataKey}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f1f5f9"
            />
            <XAxis
              dataKey="timestamp"
              hide={true}
              type="number"
              domain={["dataMin", "dataMax"]}
            />
            <YAxis domain={[0, 100]} hide={true} />
            <Tooltip
              isAnimationActive={false}
              labelStyle={{ display: "none" }}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              fillOpacity={1}
              fill={`url(#color${dataKey})`}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div
        style={{
          marginTop: "10px",
          fontWeight: "bold",
          color: color,
          textAlign: "right",
          fontSize: "1.2rem",
        }}
      >
        {data[data.length - 1]?.[dataKey] || 0}
        {unit}
      </div>
    </div>
  );

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem" }}>
            Infrastructure Overview
          </h1>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.875rem" }}>
            Live system & deployment tracking
          </p>
        </div>
        <div
          style={{
            color: status === "Online" ? "#4caf50" : "#f44336",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              ...statusDot,
              backgroundColor: status === "Online" ? "#4caf50" : "#f44336",
            }}
          />
          {status.toUpperCase()}
        </div>
      </header>

      <div style={gridStyle}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <MonitoringCard
            title="CPU Usage"
            dataKey="cpuUsage"
            color="#6366f1"
            data={history}
            unit="%"
          />
          <MonitoringCard
            title="Memory Usage"
            dataKey="memoryUsage"
            color="#10b981"
            data={history}
            unit="%"
          />
        </div>
        <DeploymentCard deployments={deployments} />
      </div>
    </div>
  );
};

// --- Updated Styles ---
const containerStyle = {
  padding: "40px",
  backgroundColor: "#f8fafc",
  minHeight: "100vh",
  fontFamily: "Inter, system-ui, sans-serif",
};
const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "30px",
  maxWidth: "1100px",
  margin: "0 auto 30px auto",
};
const gridStyle = {
  display: "grid",
  gridTemplateColumns: "1.2fr 1fr",
  gap: "24px",
  maxWidth: "1100px",
  margin: "0 auto",
};
const cardStyle = {
  backgroundColor: "#fff",
  padding: "24px",
  borderRadius: "16px",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  border: "1px solid #e2e8f0",
};
const cardTitleStyle = {
  margin: "0 0 20px 0",
  fontSize: "0.9rem",
  fontWeight: "600",
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.025em",
};
const deploymentRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px",
  borderRadius: "8px",
  backgroundColor: "#f8fafc",
  border: "1px solid #f1f5f9",
};
const statusDot = { width: "8px", height: "8px", borderRadius: "50%" };
const badgeStyle = {
  fontSize: "0.7rem",
  backgroundColor: "#e2e8f0",
  padding: "2px 8px",
  borderRadius: "4px",
  color: "#475569",
  fontWeight: "600",
};

export default App;
