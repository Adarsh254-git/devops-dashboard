import { NavLink } from "react-router-dom";
import {
  MdDashboard,
  MdCloudUpload,
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
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-bg-card border-r border-border-subtle flex flex-col h-full shrink-0 shadow-soft transition-transform duration-300 ease-out md:relative md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="p-6 flex items-center gap-3 border-b border-border-subtle/80">
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-bg-deep shrink-0 shadow-lg shadow-brand-primary/25">
          <FaServer size={18} />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-text-primary leading-tight">
            DevOps Monitor
          </h1>
          <p className="text-[0.65rem] uppercase tracking-wider text-text-muted font-semibold">
            Control plane
          </p>
        </div>
      </div>

      <nav className="flex-1 mt-4 px-3 pb-6 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border-l-[3px] ${
                isActive
                  ? "bg-brand-primary/10 text-brand-primary border-brand-primary shadow-[inset_0_0_0_1px_rgb(56_189_248_/_.15)]"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated/80 border-transparent"
              }`
            }
            onClick={() => setIsOpen(false)}
          >
            <Icon size={19} className="shrink-0 opacity-90" />
            <span className="whitespace-nowrap">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
