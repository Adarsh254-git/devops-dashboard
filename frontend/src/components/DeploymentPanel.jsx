import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { cardStyle, cardTitleStyle, statusDot } from "./Styles";

const DEPLOY_INTERVAL_MS = 30000;

// ── Styles ──────────────────────────────────────────────────────────────────
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

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.75)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
  padding: "20px",
};

const terminalStyle = {
  backgroundColor: "#0d1117",
  color: "#e6edf3",
  width: "100%",
  maxWidth: "800px",
  maxHeight: "80vh",
  borderRadius: "8px",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  border: "1px solid #30363d",
};

// ── Single Deployment Row ─────────────────────────────────────────────────────
const DeploymentRow = ({ dep, onShowLogs }) => {
  return (
    <div style={rowStyle}>
      <span
        style={{
          ...statusDot,
          backgroundColor: dep.status === "success" ? "#4caf50" : "#f44336",
        }}
      />
      <div style={{ flex: 1 }}>
        <div
          style={{ fontWeight: "600", fontSize: "0.85rem", color: "#1e293b" }}
        >
          {dep.commitMsg}
        </div>
        <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
          {dep.time} • {dep.env}
        </div>
      </div>

      {/* Show logs for both success and failure, or just failure as per your preference */}
      <button
        onClick={() => onShowLogs(dep.id)}
        style={{
          marginRight: "8px",
          fontSize: "0.7rem",
          backgroundColor: dep.status === "failure" ? "#fee2e2" : "#f1f5f9",
          color: dep.status === "failure" ? "#b91c1c" : "#475569",
          border: "1px solid",
          borderColor: dep.status === "failure" ? "#fecaca" : "#e2e8f0",
          padding: "4px 10px",
          borderRadius: "4px",
          cursor: "pointer",
          fontWeight: "700",
        }}
      >
        VIEW LOGS
      </button>

      <span style={badgeStyle}>{dep.version}</span>
    </div>
  );
};

// ── DeploymentPanel ───────────────────────────────────────────────────────────
let lastAlertedId = null;

const DeploymentPanel = () => {
  const [deployments, setDeployments] = useState([]);
  const [selectedLogs, setSelectedLogs] = useState(null);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchLogs = async (runId) => {
    setLoadingLogs(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/deployments/${runId}/logs`,
      );
      const data = await response.json();

      if (!response.ok) {
        const message = data?.details || data?.error || "Unknown error";
        setSelectedLogs(`Failed to fetch logs.\n\n${message}`);
        toast.error("Could not fetch deployment logs.");
        return;
      }

      if (data.logs) {
        setSelectedLogs(data.logs);
      } else {
        toast.warn("Logs could not be extracted.");
        setSelectedLogs("Logs could not be extracted.");
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      toast.error("Could not connect to log service.");
      setSelectedLogs("Could not connect to backend log service.");
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    const fetchDeployments = () => {
      fetch("http://localhost:5000/api/deployments")
        .then((r) => r.json())
        .then((data) => {
          if (!Array.isArray(data)) return;
          setDeployments(data.slice(0, 5));

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
    <div style={cardStyle}>
      <h3 style={cardTitleStyle}>Recent Deployments</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {deployments.length > 0 ? (
          deployments.map((dep, i) => (
            <DeploymentRow key={dep.id ?? i} dep={dep} onShowLogs={fetchLogs} />
          ))
        ) : (
          <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0 }}>
            No recent deployments found.
          </p>
        )}
      </div>

      {/* ── Terminal Modal ── */}
      {(selectedLogs || loadingLogs) && (
        <div style={modalOverlayStyle} onClick={() => setSelectedLogs(null)}>
          <div style={terminalStyle} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                padding: "10px 15px",
                borderBottom: "1px solid #30363d",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "0.8rem", fontWeight: "600" }}>
                Deployment Logs
              </span>
              <button
                onClick={() => setSelectedLogs(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#8b949e",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                }}
              >
                ×
              </button>
            </div>
            <div
              style={{
                padding: "15px",
                overflowY: "auto",
                fontSize: "0.8rem",
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
              }}
            >
              {loadingLogs ? "Fetching logs from GitHub..." : selectedLogs}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeploymentPanel;
