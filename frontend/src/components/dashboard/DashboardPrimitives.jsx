/**
 * Dashboard design system — uses Tailwind `campus.*` theme tokens.
 */

/** For rare inline styles / SVG (matches campus.brand) */
export const CAMPUS_BRAND_HEX = "#4f46e5";

export const campusInputFocus =
  "focus:border-slate-400 focus:ring-2 focus:ring-campus-brand/15 focus:outline-none";

export const campusBtnPrimary =
  "rounded-xl bg-campus-brand font-semibold text-white shadow-md shadow-slate-900/10 transition hover:bg-campus-brand-hover active:bg-campus-brand-pressed disabled:pointer-events-none disabled:opacity-60";

export const campusAccentFill = "bg-campus-brand";

export const campusTextLink =
  "font-semibold text-campus-brand-hover transition hover:text-campus-brand-pressed";

/** Secondary actions on dashboard pages */
export const dashboardBtnSecondary =
  "inline-flex items-center justify-center rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm shadow-slate-900/[0.03] transition hover:border-slate-300 hover:bg-slate-50/90 hover:shadow-md";

/** Shared card shell */
export const dashboardCardShell =
  "relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.04] ring-1 ring-slate-900/[0.03] transition duration-200 hover:shadow-md hover:ring-slate-900/[0.05]";

export function DashboardPageLayout({ eyebrow = "Dashboard", title, subtitle, children }) {
  return (
    <div className="relative min-h-full bg-zinc-100">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(228 228 231 / 0.55) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative">
        <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
          <div className="relative mx-auto max-w-6xl px-6 py-6 sm:py-7">
            <div className="absolute bottom-0 left-6 right-6 h-px max-w-2xl bg-gradient-to-r from-campus-brand/20 via-slate-200/70 to-transparent sm:left-6" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-[1.75rem] sm:leading-[1.2]">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">{subtitle}</p>
            ) : null}
          </div>
        </header>
        <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10">{children}</div>
      </div>
    </div>
  );
}

export function DashboardStatCard({ label, value, hint }) {
  return (
    <div className={`${dashboardCardShell} p-5 sm:p-6`}>
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-campus-brand/10"
        aria-hidden
      />
      <p className="relative text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="relative mt-2 text-3xl font-bold tabular-nums tracking-tight text-zinc-900">
        {value}
      </p>
      {hint ? <p className="relative mt-2 text-xs leading-relaxed text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function DashboardSection({ title, description, children }) {
  return (
    <section className={`${dashboardCardShell} p-6 sm:p-7`}>
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900">{title}</h2>
      {description ? (
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{description}</p>
      ) : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function PlaceholderBlock({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300/80 bg-zinc-50/80 px-4 py-10 text-center text-sm text-zinc-500">
      {children}
    </div>
  );
}
