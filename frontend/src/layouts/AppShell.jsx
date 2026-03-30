import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Home,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Ticket,
  UserRound,
  Building,
  Settings
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  DASHBOARD_PATHS,
  canAccessAdminTickets,
  canCreateTickets,
  getDashboardRoute,
  normalizeRoles
} from "../utils/getDashboardRoute";

function routeTitle(pathname) {
  if (pathname === "/home") return "Home";
  if (pathname === "/UserDashboard" || pathname === "/AdminDashboard" || pathname === "/TechnicianDashboard")
    return "Dashboard";
  if (pathname.startsWith("/tickets/create")) return "New ticket";
  if (pathname.startsWith("/tickets/") && pathname !== "/tickets") return "Ticket details";
  if (pathname === "/tickets") return "My tickets";
  if (pathname.startsWith("/admin/tickets")) return "Admin tickets";
  if (pathname === "/facilities") return "Facility Directory";
  if (pathname.startsWith("/admin/facilities")) return "Facility Management";
  return "Workspace";
}

function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-[3.25rem] shrink-0 items-center justify-between gap-4 border-b border-slate-200/90 bg-white px-5 shadow-[0_1px_0_0_rgba(15,23,42,0.06)] sm:px-6">
      <div className="min-w-0 flex flex-col justify-center">
        <span className="truncate text-sm font-semibold tracking-tight text-slate-900">Smart Campus Hub</span>
        <span className="truncate text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
          {routeTitle(loc.pathname)}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <div className="hidden min-w-0 text-right md:block">
          <p className="truncate text-sm font-medium text-slate-900">{user?.name ?? "User"}</p>
          <p className="truncate text-xs text-slate-500">{user?.email ?? ""}</p>
        </div>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600"
          aria-hidden
        >
          <UserRound className="h-4 w-4" strokeWidth={2} />
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-brand"
        >
          <LogOut className="h-4 w-4 text-slate-500" strokeWidth={2} />
          <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    </header>
  );
}

function Sidebar() {
  const loc = useLocation();
  const { user } = useAuth();
  const roles = user?.roles ?? (user?.role != null ? [user.role] : []);
  const primaryDash = getDashboardRoute(roles);
  const isAdmin = normalizeRoles(roles).has("ADMIN");

  const dash =
    primaryDash === DASHBOARD_PATHS.ADMIN
      ? {
          to: DASHBOARD_PATHS.ADMIN,
          label: "Admin dashboard",
          active: (p) => p.startsWith("/AdminDashboard"),
        }
      : primaryDash === DASHBOARD_PATHS.TECHNICIAN
        ? {
            to: DASHBOARD_PATHS.TECHNICIAN,
            label: "Technician dashboard",
            active: (p) => p.startsWith("/TechnicianDashboard"),
          }
        : {
            to: DASHBOARD_PATHS.USER,
            label: "User dashboard",
            active: (p) => p === "/UserDashboard",
          };

  const items = [
    { to: "/home", label: "Home", icon: Home, active: (p) => p === "/home" },
    { to: dash.to, label: dash.label, icon: LayoutDashboard, active: dash.active },
    { to: "/facilities", label: "Campus Facilities", icon: Building, active: (p) => p.startsWith("/facilities") },
  ];

  if (canCreateTickets(roles)) {
    items.push({
      to: "/tickets",
      label: "My tickets",
      icon: Ticket,
      active: (p) => p === "/tickets",
    });
    items.push({
      to: "/tickets/create",
      label: "New ticket",
      icon: PlusCircle,
      active: (p) => p === "/tickets/create",
    });
  }

  if (canAccessAdminTickets(roles)) {
    items.push({
      to: "/admin/tickets",
      label: "Admin tickets",
      icon: ClipboardList,
      active: (p) => p.startsWith("/admin/tickets"),
    });
  }

  if (isAdmin) {
    items.push({
      to: "/admin/facilities",
      label: "Facility Manager",
      icon: Settings,
      active: (p) => p.startsWith("/admin/facilities"),
    });
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-campus-line bg-campus-shell text-white">
      <div className="border-b border-white/10 px-4 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Campus</p>
        <p className="mt-0.5 text-base font-bold tracking-tight">Smart Campus</p>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
        {items.map(({ to, label, icon: Icon, active }) => {
          const on = active(loc.pathname);
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                on
                  ? "bg-white/12 text-white shadow-sm ring-1 ring-white/10"
                  : "text-zinc-300 hover:bg-white/8 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-4 py-3">
        <p className="text-[11px] leading-relaxed text-zinc-500">Maintenance & service desk</p>
      </div>
    </aside>
  );
}

export default function AppShell() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col pl-56">
        <AppHeader />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
