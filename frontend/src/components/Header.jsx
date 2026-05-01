import { MdSearch, MdNotificationsNone, MdMenu } from "react-icons/md";

export default function Header({ toggleSidebar }) {
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-bg-main border-b border-gray-800 shrink-0">
      <div className="flex items-center flex-1 max-w-md">
        <button
          className="md:hidden mr-4 text-gray-400 hover:text-white transition-colors"
          onClick={toggleSidebar}
        >
          <MdMenu size={26} />
        </button>
        <div className="relative w-full">
          <MdSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search logs, services..."
            className="w-full bg-bg-card border border-gray-700 text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:border-brand-primary text-white"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative text-gray-400 hover:text-white transition-colors">
          <MdNotificationsNone size={24} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-accent-error rounded-full block"></span>
        </button>

        <div className="flex items-center gap-3 border-l border-gray-800 pl-6">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-white">Adarsh</p>
            <p className="text-xs text-text-secondary">DevOps Engineer</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-linear-to-tr from-brand-secondary to-brand-primary flex items-center justify-center text-white font-bold">
            AD
          </div>
        </div>
      </div>
    </header>
  );
}
