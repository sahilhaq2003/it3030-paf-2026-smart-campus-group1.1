import { Link } from "react-router-dom";
import { MapPinOff } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200/80 text-slate-600">
          <MapPinOff className="h-7 w-7" strokeWidth={2} />
        </div>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          404
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          That URL does not match any screen in Smart Campus Hub. Check the address or start again
          from the home page.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex rounded-lg bg-campus-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-campus-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-brand"
          >
            Home
          </Link>
          <Link
            to="/login"
            className="inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
