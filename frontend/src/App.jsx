import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import StatsMonitor from "./components/Statsmonitor";
import DeploymentPanel from "./components/DeploymentPanel";

const App = () => {
  return (
    <Routes>
      {/* 1. Wrap everything in the Layout */}
      <Route path="/" element={<Layout />}>
        {/* 2. These will render inside the <Outlet /> of your Layout */}
        <Route
          index
          element={
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
              <StatsMonitor />
              <DeploymentPanel />
            </div>
          }
        />

        {/* Optional: Individual pages */}
        <Route path="analytics" element={<StatsMonitor />} />
        <Route path="deployments" element={<DeploymentPanel />} />
      </Route>
    </Routes>
  );
};

export default App;
