import { Link } from "react-router-dom";
import { ShieldOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getDashboardRoute } from "../../utils/getDashboardRoute";

export default function UnauthorizedPage() {
  const { user } = useAuth();
  const roles = user?.roles ?? (user?.role != null ? [user.role] : []);
  const workspaceHref = user ? getDashboardRoute(roles) : "/login";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <ShieldOff className="h-7 w-7" strokeWidth={2} />
        </div>
        <h1 className="mt-8 text-2xl font-bold tracking-tight text-slate-900">
          Access denied
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Your account is signed in, but you do not have permission to open that page. If you believe
          this is a mistake, contact a campus administrator.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to={workspaceHref}
            className="inline-flex rounded-lg bg-campus-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-campus-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-brand"
          >
            {user ? "Go to your workspace" : "Sign in"}
          </Link>
          <Link
            to="/"
            className="inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
