import { Link } from "react-router-dom";
import { ClipboardList, Shield, Users, Wrench } from "lucide-react";
import PublicPageShell from "../../components/PublicPageShell";

export default function AboutPage() {
  return (
    <PublicPageShell
      title="About Smart Campus"
      subtitle="Learn how the platform supports daily campus operations with secure, role-based workflows."
    >
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <p className="max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Smart Campus Hub is a centralized platform for campus maintenance and support operations.
            It gives students and staff an easy way to report issues, while technicians and admins
            can manage progress, assignments, and resolution from one secure system.
        </p>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: ClipboardList,
                title: "Ticket management",
                desc: "Create, monitor, and close maintenance tickets with full status history.",
              },
              {
                icon: Wrench,
                title: "Technician workflows",
                desc: "Assign jobs, update progress, and keep service delivery on schedule.",
              },
              {
                icon: Shield,
                title: "Secure role access",
                desc: "Permissions are separated for students, lecturers, technicians, and admins.",
              },
              {
                icon: Users,
                title: "Cross-team coordination",
                desc: "Facilities and IT teams collaborate through a single shared workspace.",
              },
          ].map(({ icon: Icon, title, desc }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-campus-brand">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-3 text-base font-semibold text-slate-900">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{desc}</p>
            </article>
          ))}
        </section>
      </div>
    </PublicPageShell>
  );
}
