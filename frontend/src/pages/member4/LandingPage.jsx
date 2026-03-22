import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ClipboardList, Shield, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const BRAND = "#1E3A5F";

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/home", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm"
              style={{ backgroundColor: BRAND }}
            >
              SC
            </div>
            <div>
              <span className="block font-semibold text-slate-900 leading-tight">
                Smart Campus Hub
              </span>
              <span className="text-xs text-slate-500">Operations & maintenance</span>
            </div>
          </div>
          <Link
            to="/login"
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ backgroundColor: BRAND, outlineColor: BRAND }}
          >
            Sign in
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 lg:pb-28 lg:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-600">
                Campus operations
              </p>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
                One hub for maintenance, tickets, and support
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
                Coordinate requests, assign technicians, and give admins full visibility—
                with secure, role-based access tailored to your institution.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-xl px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
                  style={{
                    backgroundColor: BRAND,
                    boxShadow: "0 12px 40px -12px rgba(30, 58, 95, 0.45)",
                  }}
                >
                  Sign in to dashboard
                </Link>
                <p className="text-sm text-slate-500 sm:max-w-[14rem]">
                  Browser-based—no install required for staff or students.
                </p>
              </div>
            </div>

            <div className="relative lg:pl-4">
              <div
                className="absolute -inset-1 rounded-3xl opacity-90 blur-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(148, 163, 184, 0.2))",
                }}
                aria-hidden
              />
              <div className="relative rounded-2xl border border-slate-200/90 bg-white p-7 shadow-xl shadow-slate-300/40">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <span className="text-sm font-semibold text-slate-800">
                    Operations snapshot
                  </span>
                  <span className="rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    Live
                  </span>
                </div>
                <ul className="mt-6 space-y-4">
                  {[
                    ["Open requests", "12"],
                    ["In progress", "5"],
                    ["Resolved today", "8"],
                  ].map(([label, value]) => (
                    <li
                      key={label}
                      className="flex items-center justify-between border-b border-slate-50 pb-4 last:border-0 last:pb-0"
                    >
                      <span className="text-sm text-slate-600">{label}</span>
                      <span className="text-sm font-bold tabular-nums text-slate-900">
                        {value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              Platform capabilities
            </p>
            <h2 className="mx-auto mt-3 max-w-2xl text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Built for administrators, technicians, and everyday users
            </h2>
            <div className="mt-14 grid gap-8 sm:grid-cols-3">
              {[
                {
                  icon: ClipboardList,
                  title: "Structured ticketing",
                  desc: "Capture issues with clear categories, priorities, and full audit history from open to closed.",
                },
                {
                  icon: Shield,
                  title: "Role-based security",
                  desc: "Separate experiences for admins, technicians, and students—least privilege by design.",
                },
                {
                  icon: Users,
                  title: "Team coordination",
                  desc: "One shared system so facilities and IT stay aligned without scattered spreadsheets.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-slate-100 bg-slate-50/80 p-7 transition hover:border-slate-200 hover:shadow-md"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: BRAND }}
                  >
                    <Icon className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-200 bg-slate-50 py-10">
          <div className="mx-auto max-w-6xl px-6 text-center text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Smart Campus Hub · Internal campus use</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
