import { Link } from "react-router-dom";
import { CircleCheckBig, ShieldCheck, UsersRound, Zap } from "lucide-react";

const helpPoints = [
  {
    title: "Secure login",
    description:
      "Students use Google authentication, so credentials are handled through a trusted sign-in flow.",
    icon: ShieldCheck,
  },
  {
    title: "Role-based access",
    description:
      "Admins and technicians sign in with email/password and get tools based on assigned permissions.",
    icon: UsersRound,
  },
  {
    title: "Easy access",
    description:
      "Choose your role tab first, then follow one clear sign-in path to reach the correct dashboard quickly.",
    icon: Zap,
  },
];

export default function LoginHelpPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <div className="mx-auto w-full max-w-4xl px-6 py-12 sm:py-16">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-semibold text-campus-brand transition hover:text-campus-brand-hover"
        >
          <span aria-hidden>←</span> Back to login
        </Link>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg shadow-slate-200/60">
          <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white px-6 py-7 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-campus-brand">
              Login process help
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              How sign-in works in Smart Campus
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-[15px]">
              Students sign in with Google from the <span className="font-semibold">Student</span>{" "}
              tab. When prompted, choose your institutional Google account. The system then opens
              your workspace based on your existing campus role and permissions.
            </p>
          </div>

          <ul className="grid divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {helpPoints.map(({ title, description, icon: Icon }) => (
              <li key={title} className="p-6">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-campus-brand/10 text-campus-brand ring-1 ring-campus-brand/15">
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <h2 className="mt-4 text-base font-semibold tracking-tight text-slate-900">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40 sm:p-7">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <CircleCheckBig className="h-4.5 w-4.5 text-emerald-600" strokeWidth={2} />
            Quick steps
          </h2>
          <ol className="mt-3 list-inside list-decimal space-y-1.5 text-sm leading-6 text-slate-600">
            <li>Open the login page and select your correct role tab.</li>
            <li>Students continue with Google; staff use email and password.</li>
            <li>Wait for redirect to your role-specific dashboard.</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
