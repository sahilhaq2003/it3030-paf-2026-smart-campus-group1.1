import { Mail, MapPin, Phone } from "lucide-react";
import PublicPageShell from "../../components/PublicPageShell";

export default function ContactPage() {
  return (
    <PublicPageShell
      title="Contact Us"
      subtitle="Get in touch with the support team for login, access, and maintenance request help."
    >
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
            Need help with login, ticket submission, or system access? Reach our support desk through
            any of the channels below.
        </p>

        <section className="mt-8 space-y-4">
          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <Mail className="mt-0.5 h-5 w-5 text-campus-brand" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Email</p>
              <p className="text-sm text-slate-600">support@smartcampus.edu</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <Phone className="mt-0.5 h-5 w-5 text-campus-brand" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Phone</p>
              <p className="text-sm text-slate-600">+94 11 234 5678</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <MapPin className="mt-0.5 h-5 w-5 text-campus-brand" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Office</p>
              <p className="text-sm text-slate-600">Facilities and IT Operations Center, Smart Campus</p>
            </div>
          </div>
        </section>
      </div>
    </PublicPageShell>
  );
}
