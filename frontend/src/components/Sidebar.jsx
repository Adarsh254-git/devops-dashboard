import { NavLink } from "react-router-dom";
import {
  MdDashboard,
  MdCloudUpload,
  MdStorage,
  MdNotificationsActive,
  MdList,
  MdAutoGraph,
  MdSettings,
} from "react-icons/md";
import { FaServer } from "react-icons/fa";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: MdDashboard },
  { path: "/deployments", label: "Deployments", icon: MdCloudUpload },
  { path: "/servers", label: "Servers", icon: FaServer },
  { path: "/alerts", label: "Alerts", icon: MdNotificationsActive },
  { path: "/logs", label: "Logs", icon: MdList },
  { path: "/ai-analyzer", label: "AI Log Analyzer", icon: MdAutoGraph },
  { path: "/settings", label: "Settings", icon: MdSettings },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 w-64 bg-bg-card border-r border-gray-800 flex flex-col h-full shrink-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-brand-primary flex items-center justify-center text-bg-main shrink-0">
          <FaServer size={18} />
        </div>
        <h1 className="text-xl font-bold tracking-wide">DevOps Monitor</h1>
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-1">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive
                  ? "bg-blue-900/40 text-brand-primary border-l-2 border-brand-primary"
                  : "text-text-secondary hover:bg-gray-800/50 hover:text-white border-l-2 border-transparent"
              }`
            }
            onClick={() => setIsOpen(false)}
          >
            <Icon size={20} className="shrink-0" />
            <span className="font-medium whitespace-nowrap">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
