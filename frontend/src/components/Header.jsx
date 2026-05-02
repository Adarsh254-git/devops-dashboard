import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { MdSearch, MdNotificationsNone, MdMenu, MdLogout } from "react-icons/md";
import { useAuth } from "../context/AuthContext";

export default function Header({ toggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (location.pathname === "/search") {
      setQuery(params.get("q") || "");
    }
  }, [location.pathname, params]);

  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      navigate("/search");
      return;
    }
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="h-14 sm:h-16 flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 bg-bg-card/40 backdrop-blur-md border-b border-border-subtle shrink-0">
      <form
        className="flex items-center flex-1 max-w-lg min-w-0"
        onSubmit={submitSearch}
        role="search"
      >
        <button
          type="button"
          className="md:hidden mr-3 p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors shrink-0"
          onClick={toggleSidebar}
          aria-label="Open menu"
        >
          <MdMenu size={22} />
        </button>
        <div className="relative w-full">
          <MdSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            size={18}
          />
          <input
            type="search"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search runs, commits, branches…"
            autoComplete="off"
            aria-label="Search runs and deployments"
            className="w-full bg-bg-deep/80 border border-border-default rounded-full pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary transition-shadow"
          />
        </div>
      </form>

      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
        <Link
          to="/alerts"
          className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
          aria-label="Open alerts"
          title="Alerts"
        >
          <MdNotificationsNone size={22} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-danger rounded-full ring-2 ring-bg-card" />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 border-l border-border-default pl-4 sm:pl-6">
          <div className="text-right hidden sm:block min-w-0 max-w-[140px]">
            <p className="text-sm font-medium text-text-primary truncate">
              {user?.displayName?.trim() || user?.email?.split("@")[0] || "User"}
            </p>
            <p className="text-xs text-text-secondary truncate">{user?.email}</p>
          </div>
          <div
            className="w-9 h-9 rounded-full bg-linear-to-tr from-brand-secondary to-brand-primary flex items-center justify-center text-bg-deep text-sm font-bold shadow-lg shadow-brand-primary/20 shrink-0"
            aria-hidden
          >
            {(user?.displayName?.[0] || user?.email?.[0] || "?").toUpperCase()}
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
            className="p-2 rounded-lg text-text-secondary hover:text-accent-danger hover:bg-bg-elevated transition-colors shrink-0"
            aria-label="Sign out"
            title="Sign out"
          >
            <MdLogout size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
