import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  DASHBOARD_PATHS,
  canAccessAdminTickets,
  canCreateTickets,
  getDashboardRoute,
  normalizeRoles
} from "../../utils/getDashboardRoute";

export default function HomePage() {
  const { user } = useAuth();

  const displayName = user?.name ?? "there";
  const roles = user?.roles ?? (user?.role != null ? [user.role] : []);
  const primaryDash = getDashboardRoute(roles);
  const isOpsAdmin =
    normalizeRoles(roles).has("ADMIN") || normalizeRoles(roles).has("MANAGER");

  const dashCard =
    primaryDash === DASHBOARD_PATHS.ADMIN
      ? {
          to: DASHBOARD_PATHS.ADMIN,
          title: "Admin dashboard",
          desc: "Operations metrics and system health",
          emoji: "🛡",
        }
      : primaryDash === DASHBOARD_PATHS.TECHNICIAN
        ? {
            to: DASHBOARD_PATHS.TECHNICIAN,
            title: "Technician dashboard",
            desc: "Assignments and field work queue",
            emoji: "👷",
          }
        : {
            to: DASHBOARD_PATHS.USER,
            title: "User dashboard",
            desc: "Your overview, activity, and shortcuts",
            emoji: "👤",
          };

  const cards = [
    dashCard,
    {
      to: "/facilities",
      title: "Campus Directory",
      desc: "View public map and reserve available resources",
      emoji: "🏫",
    }
  ];

  if (canCreateTickets(roles)) {
    cards.push(
      {
        to: "/tickets",
        title: "My tickets",
        desc: "View and track your maintenance requests",
        emoji: "🎫",
      },
      {
        to: "/tickets/create",
        title: "New ticket",
        desc: "Report an issue on campus",
        emoji: "➕",
      },
    );
  }

  if (canAccessAdminTickets(roles)) {
    cards.push({
      to: "/admin/tickets",
      title: "Admin tickets",
      desc: "Review and manage all tickets",
      emoji: "📋",
    });
  }

  if (isOpsAdmin) {
    cards.push({
      to: "/admin/facilities",
      title: "Facility Manager",
      desc: "Manage physical registries and overrides",
      emoji: "⚙️",
    });
  }

  return (
    <div className="relative min-h-full bg-slate-100">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.3]"
        aria-hidden
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(203 213 225 / 0.5) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-6 py-8 sm:py-10">
        <div className="mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Overview</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Welcome back, {displayName}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
            Shortcuts to your dashboard and tickets. Use the sidebar for full navigation — log out anytime from the top bar.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {cards.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-900/[0.04] ring-1 ring-slate-900/[0.03] transition duration-200 hover:border-slate-300/90 hover:shadow-md hover:ring-slate-900/[0.05]"
            >
              <div className="text-2xl leading-none opacity-90">{c.emoji}</div>
              <h2 className="mt-4 text-base font-semibold text-slate-900 group-hover:text-campus-brand-hover">
                {c.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{c.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
