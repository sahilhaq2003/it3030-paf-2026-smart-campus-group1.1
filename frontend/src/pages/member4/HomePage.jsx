import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const displayName = user?.name ?? "there";

  const cards = [
    { to: "/tickets", title: "My tickets", desc: "View and track your maintenance requests", emoji: "🎫" },
    { to: "/tickets/create", title: "New ticket", desc: "Report an issue on campus", emoji: "➕" },
    { to: "/admin/tickets", title: "Admin", desc: "Review all tickets", emoji: "🛠" },
    { to: "/technician", title: "Technician", desc: "Field work dashboard", emoji: "👷" },
  ];

  return (
    <div className="min-h-full flex flex-col bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <h1 className="text-lg font-semibold text-blue-900 sm:text-xl">
            Smart Campus Hub
          </h1>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <div className="mb-8">
          <p className="text-sm font-medium text-blue-600">Dashboard</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Welcome back, {displayName}
          </h2>
          <p className="mt-2 max-w-xl text-slate-600">
            Here’s a quick overview. Use the shortcuts below or the sidebar to move around the app.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
            >
              <div className="text-2xl">{c.emoji}</div>
              <h3 className="mt-3 font-semibold text-slate-900 group-hover:text-blue-800">
                {c.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{c.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
