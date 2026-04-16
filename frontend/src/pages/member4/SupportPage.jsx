import { CircleCheckBig, LifeBuoy, ShieldCheck, UsersRound, Zap } from "lucide-react";
import PublicPageShell from "../../components/PublicPageShell";

const supportPoints = [
  {
    title: "Secure login",
    description:
      "Students use Google authentication while staff and lecturers use role-specific secure sign-in.",
    icon: ShieldCheck,
  },
  {
    title: "Role-based access",
    description:
      "Admins, technicians, lecturers, and students see only the pages and actions they are allowed to use.",
    icon: UsersRound,
  },
  {
    title: "Quick support",
    description:
      "Use this guide if you cannot sign in, if OTP fails, or if your account role appears incorrect.",
    icon: Zap,
  },
];

export default function SupportPage() {
  return (
    <PublicPageShell
      title="Support and Login Guide"
      subtitle="Get quick help for login errors, role selection, and account access issues."
    >
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <p className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-campus-brand">
            <LifeBuoy className="h-4 w-4" />
            Help center
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Follow these steps if you need help with authentication, role selection, or accessing
            your dashboard after sign in.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {supportPoints.map(({ title, description, icon: Icon }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-campus-brand/10 text-campus-brand">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-3 text-base font-semibold text-slate-900">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
            </article>
          ))}
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <CircleCheckBig className="h-4 w-4 text-emerald-600" />
            Quick steps
          </h2>
          <ol className="mt-3 list-inside list-decimal space-y-1.5 text-sm leading-6 text-slate-600">
            <li>Select your role tab first (Student, Admin/Technician, Lecturer).</li>
            <li>Use the matching login method shown in that tab.</li>
            <li>If sign-in fails, verify your email/OTP and retry.</li>
            <li>Contact support from the Contact page if issues continue.</li>
          </ol>
        </section>
      </div>
    </PublicPageShell>
  );
}
