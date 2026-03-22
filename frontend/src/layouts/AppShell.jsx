import { Link, useLocation, Outlet } from "react-router-dom";

function Sidebar() {
  const loc = useLocation();
  const links = [
    { to: "/home", label: "🏠 Home", active: (p) => p === "/home" },
    { to: "/dashboard/user", label: "👤 User dashboard", active: (p) => p.startsWith("/dashboard/user") },
    { to: "/dashboard/admin", label: "🛡 Admin dashboard", active: (p) => p.startsWith("/dashboard/admin") },
    { to: "/dashboard/technician", label: "👷 Tech dashboard", active: (p) => p.startsWith("/dashboard/technician") },
    { to: "/tickets", label: "🎫 My Tickets", active: (p) => p === "/tickets" },
    { to: "/tickets/create", label: "➕ New Ticket", active: (p) => p === "/tickets/create" },
    { to: "/admin/tickets", label: "🛠 Admin tickets", active: (p) => p.startsWith("/admin/tickets") },
  ];
  return (
    <div className="w-56 min-h-screen bg-[#1E3A5F] text-white flex flex-col py-6 px-4 fixed left-0 top-0">
      <div className="text-xl font-bold mb-8 px-2">🏫 Smart Campus</div>
      <nav className="space-y-1">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`block px-3 py-2 rounded-lg text-sm transition-colors
              ${
                l.active(loc.pathname)
                  ? "bg-[#2563EB] text-white font-medium"
                  : "text-blue-100 hover:bg-blue-800"
              }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto px-2 text-xs text-blue-300">Maintenance & tickets</div>
    </div>
  );
}

export default function AppShell() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-56 flex-1 min-h-screen bg-[#F8FAFC]">
        <Outlet />
      </main>
    </div>
  );
}
