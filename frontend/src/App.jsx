import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./components/Dashboard";
import DeploymentPanel from "./components/DeploymentPanel";
import HealthPanel from "./components/HealthPanel";
import LogsPanel from "./components/LogsPanel";
import AiLogAnalyzer from "./components/AiLogAnalyzer";
import SearchResults from "./components/SearchResults";
import AlertsPanel from "./components/AlertsPanel";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Settings from "./pages/Settings";

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="search" element={<SearchResults />} />

          <Route path="servers" element={<HealthPanel />} />

          <Route path="deployments" element={<DeploymentPanel />} />
          <Route path="logs" element={<LogsPanel />} />
          <Route path="ai-analyzer" element={<AiLogAnalyzer />} />
          <Route path="alerts" element={<AlertsPanel />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default App;
