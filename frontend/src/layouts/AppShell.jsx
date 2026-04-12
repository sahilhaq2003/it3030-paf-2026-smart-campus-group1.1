import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  ClipboardList,
  CircleUser,
  Home,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Ticket,
  UserRound,
  Users,
  Building,
  Settings,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../hooks/useNotifications";
import NotificationPanel from "../components/notifications/NotificationPanel";
import FlashToast from "../components/feedback/FlashToast";
import {
  DASHBOARD_PATHS,
  canAccessAdminTickets,
  canCreateTickets,
  getDashboardRoute,
  normalizeRoles
} from "../utils/getDashboardRoute";

function routeTitle(pathname) {
  if (pathname === "/home") return "Home";
  if (
    pathname === "/UserDashboard" ||
    pathname === "/LecturerDashboard" ||
    pathname === "/AdminDashboard" ||
    pathname === "/TechnicianDashboard"
  )
    return "Dashboard";
  if (pathname.startsWith("/tickets/create")) return "New ticket";
  if (pathname.startsWith("/tickets/") && pathname !== "/tickets") return "Ticket details";
  if (pathname === "/tickets") return "My tickets";
  if (pathname.startsWith("/admin/tickets")) return "Admin tickets";
  if (pathname === "/facilities") return "Facility Directory";
  if (pathname.startsWith("/admin/facilities")) return "Facility Management";
  if (pathname.startsWith("/admin/users")) return "User management";
  if (pathname === "/profile") return "Profile";
  return "Workspace";
}

function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [panelOpen, setPanelOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    isLoading,
    markRead,
    markAllRead,
    deleteNotification,
    isMarkingAllRead,
  } = useNotifications(Boolean(user));

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const avatarSrc = useMemo(() => {
    if (user?.avatarUrl && String(user.avatarUrl).trim()) return String(user.avatarUrl).trim();
    const seed = encodeURIComponent(user?.email || user?.name || "user");
    return `https://ui-avatars.com/api/?name=${seed}&background=EEF2FF&color=4338CA&size=64&bold=true`;
  }, [user?.avatarUrl, user?.email, user?.name]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[3.25rem] shrink-0 items-center justify-between gap-4 border-b border-white/40 bg-white/60 px-5 shadow-[0_1px_0_0_rgba(15,23,42,0.04)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/50 sm:px-6">
        <div className="min-w-0 flex flex-col justify-center">
          <span className="truncate text-sm font-semibold tracking-tight text-slate-900">Smart Campus Hub</span>
          <span className="truncate text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
            {routeTitle(loc.pathname)}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <div className="hidden min-w-0 text-right md:block">
            <p className="truncate text-sm font-medium text-slate-900">{user?.name ?? "User"}</p>
            <p className="truncate text-xs text-slate-500">{user?.email ?? ""}</p>
          </div>
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/55 bg-white/55 text-slate-600 shadow-sm backdrop-blur-md transition hover:border-white/75 hover:bg-white/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-brand"
            aria-label={
              unreadCount > 0
                ? `Notifications (${unreadCount} unread)`
                : "Notifications"
            }
          >
            <Bell className="h-4 w-4" strokeWidth={2} />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </button>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/55 bg-white/40 backdrop-blur-md">
            <img
              src={avatarSrc}
              alt={user?.name ? `${user.name} avatar` : "Profile avatar"}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user?.name || user?.email || "user",
                )}&background=EEF2FF&color=4338CA&size=64&bold=true`;
                if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
              }}
            />
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-white/55 bg-white/55 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-md transition hover:border-white/75 hover:bg-white/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-brand"
          >
            <LogOut className="h-4 w-4 text-slate-500" strokeWidth={2} />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </header>
      <NotificationPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        isLoading={isLoading}
        onMarkAllRead={markAllRead}
        onMarkRead={markRead}
        onDelete={deleteNotification}
        markAllPending={isMarkingAllRead}
      />
    </>
  );
}

function Sidebar() {
  const loc = useLocation();
  const { user } = useAuth();
  const roles = user?.roles ?? (user?.role != null ? [user.role] : []);
  const primaryDash = getDashboardRoute(roles);
  const isOpsAdmin =
    normalizeRoles(roles).has("ADMIN") || normalizeRoles(roles).has("MANAGER");

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
        : primaryDash === DASHBOARD_PATHS.LECTURER
          ? {
              to: DASHBOARD_PATHS.LECTURER,
              label: "Lecturer dashboard",
              active: (p) => p.startsWith("/LecturerDashboard"),
            }
        : {
            to: DASHBOARD_PATHS.USER,
            label: "User dashboard",
            active: (p) => p === "/UserDashboard",
          };

  const items = [
    { to: "/home", label: "Home", icon: Home, active: (p) => p === "/home" },
    {
      to: "/profile",
      label: "Profile",
      icon: CircleUser,
      active: (p) => p === "/profile",
    },
    { to: dash.to, label: dash.label, icon: LayoutDashboard, active: dash.active },
    {
      to: "/facilities",
      label: "Campus Facilities",
      icon: Building,
      active: (p) => p.startsWith("/facilities"),
    },
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

  if (isOpsAdmin) {
    items.push({
      to: "/admin/users",
      label: "Users",
      icon: Users,
      active: (p) => p.startsWith("/admin/users"),
    });
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
  const location = useLocation();
  const navigate = useNavigate();
  const [flashMessage, setFlashMessage] = useState(
    typeof location.state?.loginSuccess === "string" ? location.state.loginSuccess : "",
  );

  useEffect(() => {
    const nextMessage =
      typeof location.state?.loginSuccess === "string" ? location.state.loginSuccess : "";
    if (!nextMessage) return;

    setFlashMessage(nextMessage);

    navigate(location.pathname, {
      replace: true,
      state: { ...(location.state || {}), loginSuccess: undefined },
    });
  }, [location.pathname, location.state, navigate]);

  return (
    <div className="min-h-screen bg-slate-100">
      <FlashToast message={flashMessage} onClose={() => setFlashMessage("")} />
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
