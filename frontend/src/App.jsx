import React, { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import StatsMonitor from "./components/Statsmonitor";
import DeploymentPanel from "./components/DeploymentPanel";
import {
  containerStyle,
  headerStyle,
  gridStyle,
  statusDot,
} from "./components/Styles";

// ── App ───────────────────────────────────────────────────────────────────────
// Thin root component — owns only the connection status badge.
// All data-fetching logic lives inside StatsMonitor and DeploymentPanel.

const App = () => {
  const [status, setStatus] = useState("Connecting...");

  const dotColor =
    status === "Online"
      ? "#4caf50"
      : status === "Offline"
        ? "#f44336"
        : "#f59e0b";

  return (
    <div style={containerStyle}>
      {/* ── Header ── */}
      <header style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", color: "#0f172a" }}>
            Infrastructure Overview
          </h1>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.875rem" }}>
            Live system &amp; deployment tracking
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              ...statusDot,
              backgroundColor: dotColor,
              boxShadow: `0 0 6px ${dotColor}`,
            }}
          />
          <span
            style={{
              fontWeight: 700,
              fontSize: "0.85rem",
              color: dotColor,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {status}
          </span>
        </div>
      </header>

      {/* ── Main Grid ── */}
      <div style={gridStyle}>
        {/* Left column — live charts */}
        <StatsMonitor onStatusChange={setStatus} />

        {/* Right column — deployment history */}
        <DeploymentPanel />
      </div>

      {/* Toast portal — place once at root */}
      <ToastContainer />
    </div>
  );
};

export default App;
