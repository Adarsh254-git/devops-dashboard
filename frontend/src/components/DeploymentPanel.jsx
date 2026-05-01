import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { cardStyle, cardTitleStyle, statusDot } from "./Styles";

const DEPLOY_INTERVAL_MS = 30000;

const badgeStyle = {
  fontSize: "0.7rem",
  backgroundColor: "#e2e8f0",
  padding: "2px 8px",
  borderRadius: "4px",
  color: "#475569",
  fontWeight: "600",
};

const rowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px",
  borderRadius: "8px",
  backgroundColor: "#f8fafc",
  border: "1px solid #f1f5f9",
};

// ── Single Deployment Row ─────────────────────────────────────────────────────
const DeploymentRow = ({ dep }) => (
  <div style={rowStyle}>
    <span
      style={{
        ...statusDot,
        backgroundColor: dep.status === "success" ? "#4caf50" : "#f44336",
      }}
    />
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: "600", fontSize: "0.85rem", color: "#1e293b" }}>
        {dep.commitMsg}
      </div>
      <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
        {dep.time} • {dep.env}
      </div>
    </div>
    <span style={badgeStyle}>{dep.version}</span>
  </div>
);

// ── DeploymentPanel ───────────────────────────────────────────────────────────
/**
 * Fetches /api/deployments every 30 s.
 * Shows a toast alert when the latest deployment has status "failure".
 */
let lastAlertedId = null;
const DeploymentPanel = () => {
  const [deployments, setDeployments] = useState([]);

  useEffect(() => {
    // Track the last alerted deployment so we don't spam the same failure

    const fetchDeployments = () => {
      fetch("http://localhost:5000/api/deployments")
        .then((r) => r.json())
        .then((data) => {
          if (!Array.isArray(data)) return;
          const top5 = data.slice(0, 5);
          setDeployments(top5);

          // Alert only once per unique failed deployment
          const latest = data[0];
          if (
            latest &&
            latest.status === "failure" &&
            latest.id !== lastAlertedId
          ) {
            lastAlertedId = latest.id;
            toast.error(`Deployment Failed — ${latest.commitMsg}`, {
              position: "top-right",
              autoClose: 5000,
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
    <div style={cardStyle}>
      <h3 style={cardTitleStyle}>Recent Deployments</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {deployments.length > 0 ? (
          deployments.map((dep, i) => (
            <DeploymentRow key={dep.id ?? i} dep={dep} />
          ))
        ) : (
          <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0 }}>
            No recent deployments found.
          </p>
        )}
      </div>
    </div>
  );
};

export default DeploymentPanel;
