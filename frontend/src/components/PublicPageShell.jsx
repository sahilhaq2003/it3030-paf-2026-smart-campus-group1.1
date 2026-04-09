import { Link } from "react-router-dom";

export default function PublicPageShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 antialiased">
      <main>
        <section className="relative overflow-hidden px-3 pb-8 pt-3 sm:px-6 sm:pb-10 sm:pt-4">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl shadow-2xl shadow-slate-900/20 sm:rounded-[28px]">
            <div
              className="absolute inset-0 z-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "linear-gradient(115deg, rgba(2,6,23,0.83) 0%, rgba(15,23,42,0.65) 42%, rgba(15,23,42,0.2) 100%), url('https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1600&q=80')",
              }}
            />

            <header className="relative z-30 px-3 pt-3 sm:px-8 sm:pt-6">
              <div className="flex items-center justify-between rounded-2xl border border-white/20 bg-white/10 px-3 py-2.5 backdrop-blur-md sm:px-4 sm:py-3">
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
                  <Link to="/support" className="transition hover:text-white">
                    Support
                  </Link>
                  <Link to="/about" className="transition hover:text-white">
                    About
                  </Link>
                </nav>
                <Link
                  to="/login"
                  className="rounded-full bg-white/20 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/30 sm:px-4 sm:text-sm"
                >
                  Login
                </Link>
              </div>
            </header>

            <div className="relative z-20 flex min-h-[340px] items-center px-4 pb-14 pt-10 sm:min-h-[380px] sm:px-10 sm:pb-16 sm:pt-12">
              <div className="max-w-2xl text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200">
                  Smart Campus System
                </p>
                <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-5xl">{title}</h1>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-200 sm:text-lg">{subtitle}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 sm:pb-16">{children}</section>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-12 md:grid-cols-[1.4fr_1fr_1fr]">
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
                <Link to="/support" className="block text-slate-600 transition hover:text-campus-brand">
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
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-center text-xs text-slate-500 sm:flex-row sm:px-6 sm:text-left">
              <p>© {new Date().getFullYear()} Smart Campus Hub. All rights reserved.</p>
              <p>For internal campus operational use</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
