import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  MapPin,
  Search,
  Shield,
  Users,
  Wrench
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getDashboardRoute } from "../../utils/getDashboardRoute";

const heroSlides = [
  "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80",
];

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (user) {
      const roles = user.roles ?? (user.role != null ? [user.role] : []);
      navigate(getDashboardRoute(roles), { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 antialiased">
      <main>
        <section className="relative overflow-hidden px-4 pb-10 pt-4 sm:px-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[28px] shadow-2xl shadow-slate-900/20">
            {heroSlides.map((slide, index) => (
              <div
                key={slide}
                className={`pointer-events-none absolute inset-0 z-0 bg-cover bg-center transition-all duration-1000 ${
                  index === activeSlide ? "scale-100 opacity-100" : "scale-105 opacity-0"
                }`}
                style={{
                  backgroundImage: `linear-gradient(115deg, rgba(2,6,23,0.83) 0%, rgba(15,23,42,0.65) 42%, rgba(15,23,42,0.2) 100%), url('${slide}')`,
                }}
              />
            ))}

            <header className="relative z-30 px-4 pt-4 sm:px-8 sm:pt-6">
              <div className="flex items-center justify-between rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-md">
                <div className="flex items-center gap-3 text-white">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-sm font-bold">
                    SC
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Smart Campus</p>
                    <p className="text-xs text-white/80">Maintenance portal</p>
                  </div>
                </div>
                <nav className="hidden items-center gap-7 text-sm font-medium text-white/90 md:flex">
                  <Link to="/" className="transition hover:text-white">
                    Home
                  </Link>
                  <Link to="/contact" className="transition hover:text-white">
                    Contact
                  </Link>
                  <Link to="/login/help" className="transition hover:text-white">
                    Support
                  </Link>
                  <Link to="/about" className="transition hover:text-white">
                    About
                  </Link>
                </nav>
                <Link
                  to="/login"
                  className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/30"
                >
                  Login
                </Link>
              </div>
            </header>

            <div className="relative z-20 flex min-h-[560px] items-center px-6 pb-28 pt-12 sm:px-10">
              <div className="max-w-2xl text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200">
                  Smart Campus System
                </p>
                <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-6xl">
                  Campus Support Made Simple
                </h1>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg">
                  Submit maintenance requests, track progress in real time, and coordinate with
                  technicians and admins from one portal.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 rounded-full bg-white/20 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/30"
                  >
                    Go to login
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/login/help"
                    className="inline-flex items-center rounded-full border border-white/30 bg-transparent px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Login help
                  </Link>
                </div>
              </div>
            </div>

            <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 gap-2">
              {heroSlides.map((slide, index) => (
                <button
                  key={`dot-${slide}`}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  className={`h-2.5 rounded-full transition-all ${
                    activeSlide === index ? "w-8 bg-white" : "w-2.5 bg-white/60 hover:bg-white/90"
                  }`}
                  aria-label={`Show slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="relative z-40 mx-auto -mt-8 max-w-4xl px-2 sm:-mt-12">
            <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10 sm:grid-cols-[1fr_1fr_1fr_auto] sm:p-4">
              {[
                { label: "Area", value: "Main campus", icon: MapPin },
                { label: "Issue Type", value: "Electrical / IT / Facility", icon: ClipboardList },
                { label: "Priority", value: "Low / Normal / High", icon: Shield },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-2xl px-3 py-2">
                  <p className="text-xs font-medium text-slate-500">{label}</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Icon className="h-4 w-4 text-campus-brand" />
                    {value}
                  </p>
                </div>
              ))}
              <Link
                to="/tickets/create"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Search className="h-4 w-4" />
                Create Ticket
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-14">
          <div className="text-center">
            <h2 className="text-4xl font-bold tracking-tight text-slate-900">Most Used Features</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500">
              Quickly access core modules used by students, staff, technicians, and administrators.
            </p>
          </div>
          <div className="mt-9 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Create Ticket",
                desc: "Report new issues with category and priority.",
                image:
                  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1000&q=80",
                to: "/tickets/create",
              },
              {
                title: "Track My Tickets",
                desc: "See progress and updates on your requests.",
                image:
                  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1000&q=80",
                to: "/tickets",
              },
              {
                title: "Browse Facilities",
                desc: "Find campus buildings, labs, and service locations.",
                image:
                  "https://images.unsplash.com/photo-1564981797816-1043664bf78d?auto=format&fit=crop&w=1000&q=80",
                to: "/facilities",
              },
            ].map((item) => (
              <Link
                key={item.title}
                to={item.to}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-44 w-full rounded-2xl object-cover transition duration-300 group-hover:scale-[1.02]"
                />
                <div className="px-2 pb-2 pt-4 text-left">
                  <p className="text-lg font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="grid gap-4 rounded-3xl bg-white p-4 shadow-sm sm:grid-cols-4 sm:p-6">
            {[
              { icon: ClipboardList, stat: "24/7", label: "Ticket access" },
              { icon: Wrench, stat: "Live", label: "Status tracking" },
              { icon: Users, stat: "3+", label: "User roles" },
              { icon: Building2, stat: "All", label: "Campus units" },
            ].map(({ icon: Icon, stat, label }) => (
              <div key={stat + label} className="rounded-2xl bg-slate-50 p-5 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-campus-brand">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-3xl font-bold text-slate-900">{stat}</p>
                <p className="mt-1 text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-campus-brand text-sm font-bold text-white">
                  SC
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">Smart Campus Hub</p>
                  <p className="text-xs text-slate-500">Maintenance & support portal</p>
                </div>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
                Unified portal for issue reporting, assignment, and resolution tracking across your
                campus operations.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-900">Navigation</p>
              <div className="mt-4 space-y-2 text-sm">
                <Link to="/about" className="block text-slate-600 transition hover:text-campus-brand">
                  About
                </Link>
                <Link to="/contact" className="block text-slate-600 transition hover:text-campus-brand">
                  Contact
                </Link>
                <Link to="/login/help" className="block text-slate-600 transition hover:text-campus-brand">
                  Support
                </Link>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-900">Contact</p>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>support@smartcampus.edu</p>
                <p>+94 11 234 5678</p>
                <p>Mon - Fri, 8:30 AM - 5:30 PM</p>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-4 text-xs text-slate-500 sm:flex-row">
              <p>© {new Date().getFullYear()} Smart Campus Hub. All rights reserved.</p>
              <p>For internal campus operational use</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
