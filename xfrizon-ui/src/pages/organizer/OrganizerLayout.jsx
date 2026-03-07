import { useEffect, useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { Outlet, useLocation } from "react-router-dom";
import OrganizerSidebar from "../../component/organizer/OrganizerSidebar";

const OrganizerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-black text-white">
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-200 lg:hidden ${
          sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className="hidden lg:block">
        <OrganizerSidebar className="h-screen sticky top-0" />
      </div>

      <OrganizerSidebar
        onNavigate={() => setSidebarOpen(false)}
        className={`fixed left-0 top-0 z-50 h-dvh transform transition-transform duration-200 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      />

      <div className="w-full flex-1 overflow-auto bg-black p-4 pt-5 sm:p-6 lg:p-8">
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs uppercase tracking-widest text-gray-300 transition-colors hover:border-zinc-500"
          >
            <FaBars className="h-4 w-4" />
            Menu
          </button>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs uppercase tracking-widest text-gray-300 transition-colors hover:border-zinc-500"
            >
              <FaTimes className="h-4 w-4" />
              Close
            </button>
          )}
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default OrganizerLayout;
