import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { format, parseISO } from "date-fns";
import {
  Bell,
  BellOff,
  CalendarDays,
  ClipboardList,
  Edit3,
  Loader2,
  Lock,
  Mail,
  Save,
  ShieldCheck,
  Ticket,
  User,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ticketApi } from "../../api/ticketApi";
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from "../../api/notificationsApi";
import { normalizeRoles } from "../../utils/getDashboardRoute";

/* ─── pure helpers ─────────────────────────────────────────────────────────── */

function formatJoined(iso) {
  if (!iso) return "—";
  try { return format(parseISO(iso), "MMMM d, yyyy"); } catch { return "—"; }
}

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function roleColor(role) {
  const map = {
    ADMIN:      "bg-rose-50   text-rose-700   ring-1 ring-rose-200",
    MANAGER:    "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
    TECHNICIAN: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
    LECTURER:   "bg-teal-50   text-teal-700   ring-1 ring-teal-200",
  };
  return map[role] ?? "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
}

function providerLabel(p) {
  if (!p) return "—";
  if (p === "google") return "Google OAuth";
  if (p === "local")  return "Email & password";
  return p;
}

/* ─── Toggle ────────────────────────────────────────────────────────────────── */
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-campus-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-campus-brand" : "bg-slate-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

/* ─── Stat card ─────────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, accent }) {
  const accents = {
    indigo: { wrap: "bg-indigo-50 text-indigo-600", num: "text-indigo-700" },
    violet: { wrap: "bg-violet-50 text-violet-600", num: "text-violet-700" },
    emerald:{ wrap: "bg-emerald-50 text-emerald-600", num: "text-emerald-700" },
    sky:    { wrap: "bg-sky-50 text-sky-600", num: "text-sky-700" },
  };
  const a = accents[accent] ?? accents.indigo;
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${a.wrap}`}>
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <div>
        <p className={`text-2xl font-bold tabular-nums tracking-tight ${a.num}`}>{value}</p>
        <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}

/* ─── Tab bar ───────────────────────────────────────────────────────────────── */
const TABS = [
  { key: "profile",       label: "Profile",       icon: User       },
  { key: "notifications", label: "Notifications", icon: Bell       },
  { key: "account",       label: "Account",       icon: ShieldCheck},
];

function TabBar({ active, onChange }) {
  return (
    <nav className="flex gap-0.5 rounded-xl border border-slate-200 bg-slate-100/70 p-1">
      {TABS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            active === key
              ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/[0.06]"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </nav>
  );
}

/* ─── Read-only field row ───────────────────────────────────────────────────── */
function FieldRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-50 py-3.5 last:border-0">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium text-slate-800">{value || "—"}</p>
      </div>
      <Lock className="h-3.5 w-3.5 shrink-0 text-slate-300" strokeWidth={2} />
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const roles    = user?.roles ?? (user?.role != null ? [user.role] : []);
  const roleSet  = normalizeRoles(roles);
  const isTech   = roleSet.has("TECHNICIAN");

  const [activeTab,    setActiveTab]    = useState("profile");
  const [name,         setName]         = useState("");
  const [saving,       setSaving]       = useState(false);
  const [editingName,  setEditingName]  = useState(false);
  const [inApp,        setInApp]        = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  /* queries */
  const prefsQuery = useQuery({
    queryKey: ["profile", "notifPrefs", user?.id],
    queryFn:  () => fetchNotificationPreferences(),
    enabled:  Boolean(user?.id),
  });

  const myTicketsQuery = useQuery({
    queryKey: ["profile", "myTickets", user?.id],
    queryFn:  () => ticketApi.getMyTickets({ page: 0, size: 1 }).then((r) => r.data),
    enabled:  Boolean(user?.id),
  });

  const assignedQuery = useQuery({
    queryKey: ["profile", "assigned", user?.id],
    queryFn:  () => ticketApi.getAssignedTickets({ page: 0, size: 1 }).then((r) => r.data),
    enabled:  Boolean(user?.id) && isTech,
  });

  /* mutations */
  const savePrefsMutation = useMutation({
    mutationFn: (body) => updateNotificationPreferences(body),
    onSuccess:  () => toast.success("Preferences saved"),
    onError:    (err) => toast.error(err?.response?.data?.message ?? "Could not save"),
  });

  /* effects */
  useEffect(() => {
    if (user) setName(user.name ?? "");
  }, [user]);

  useEffect(() => {
    if (!prefsQuery.data) return;
    setInApp(Boolean(prefsQuery.data.inAppEnabled));
    setEmailEnabled(Boolean(prefsQuery.data.emailEnabled));
  }, [prefsQuery.data]);

  /* derived */
  const rolesArray     = useMemo(() => [...roleSet].sort(), [roleSet]);
  const myTotal        = myTicketsQuery.data?.totalElements;
  const assignedTotal  = assignedQuery.data?.totalElements;

  const avatarSrc = useMemo(() => {
    if (user?.avatarUrl?.trim()) return user.avatarUrl.trim();
    const seed = encodeURIComponent(user?.email || user?.name || "user");
    return `https://ui-avatars.com/api/?name=${seed}&background=EEF2FF&color=4338CA&size=128&bold=true`;
  }, [user?.avatarUrl, user?.email, user?.name]);

  const handleSaveName = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      await updateProfile({ name: trimmed });
      toast.success("Profile updated");
      setEditingName(false);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  /* ── render ── */
  return (
    <div className="min-h-full bg-slate-50/80">

      {/* ── HERO BANNER ─────────────────────────────────────────────────────── */}
      <div className="relative h-44 overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 sm:h-52">
        {/* subtle grid */}
        <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pg" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pg)" />
        </svg>
        <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-10 bottom-0  h-48 w-48 rounded-full bg-purple-400/20 blur-2xl" />
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">

        {/* ── IDENTITY CARD (avatar overlaps hero) ── */}
        <div className="relative -mt-16 rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-900/[0.04] sm:-mt-20">

          {/* avatar — absolutely placed at top-left, hanging out of the card */}
          <div className="absolute -top-10 left-6 sm:-top-12">
            <div className="relative">
              <img
                src={avatarSrc}
                alt={user?.name ?? "Profile"}
                className="h-20 w-20 rounded-2xl border-4 border-white object-cover shadow-lg sm:h-24 sm:w-24"
                onError={(e) => {
                  const fb = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=EEF2FF&color=4338CA&size=128&bold=true`;
                  if (e.currentTarget.src !== fb) e.currentTarget.src = fb;
                }}
              />
              {/* online dot */}
              <span className="absolute bottom-1 right-1 flex h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400 shadow-sm" />
            </div>
          </div>

          {/* identity text — padded top so it sits BELOW the avatar */}
          <div className="px-6 pb-6 pt-14 sm:pt-16">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  {user?.name ?? "Your Name"}
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">{user?.email ?? ""}</p>
              </div>
              {/* role badges */}
              <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-0 sm:justify-end">
                {rolesArray.map((r) => (
                  <span
                    key={r}
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${roleColor(r)}`}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>

            {/* divider */}
            <div className="mt-5 border-t border-slate-100 pt-5">
              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
                  icon={Ticket}
                  label="Tickets filed"
                  value={myTicketsQuery.isLoading ? "…" : (myTotal ?? 0)}
                  accent="indigo"
                />
                {isTech ? (
                  <StatCard
                    icon={ClipboardList}
                    label="Assigned to me"
                    value={assignedQuery.isLoading ? "…" : (assignedTotal ?? 0)}
                    accent="violet"
                  />
                ) : (
                  <StatCard
                    icon={ShieldCheck}
                    label="Primary role"
                    value={rolesArray[0] ?? "User"}
                    accent="sky"
                  />
                )}
                <StatCard
                  icon={CalendarDays}
                  label="Member since"
                  value={user?.createdAt ? format(parseISO(user.createdAt), "yyyy") : "—"}
                  accent="emerald"
                />
                <StatCard
                  icon={User}
                  label="Sign-in"
                  value={user?.provider === "google" ? "Google" : "Password"}
                  accent="sky"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── TAB BAR ── */}
        <div className="mt-6">
          <TabBar active={activeTab} onChange={setActiveTab} />
        </div>

        {/* ══════════════════ TAB: PROFILE ══════════════════ */}
        {activeTab === "profile" && (
          <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-900/[0.03]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Display name</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Appears on tickets, comments, and your public campus profile.
                </p>
              </div>
              {!editingName && (
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-white"
                >
                  <Edit3 className="h-3.5 w-3.5" strokeWidth={2} />
                  Edit name
                </button>
              )}
            </div>

            <div className="mt-5">
              {editingName ? (
                <form onSubmit={handleSaveName} className="space-y-4">
                  <div>
                    <label htmlFor="pname" className="block text-xs font-semibold text-slate-500">
                      Full name
                    </label>
                    <input
                      id="pname"
                      type="text"
                      autoComplete="name"
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-campus-brand focus:ring-2 focus:ring-campus-brand/20"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl bg-campus-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-campus-brand-hover disabled:opacity-60"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" strokeWidth={2} />}
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingName(false); setName(user?.name ?? ""); }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2} />
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-sm font-bold text-indigo-700">
                    {getInitials(user?.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-900">{user?.name ?? "—"}</p>
                    <p className="text-xs text-slate-400">Display name</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════ TAB: NOTIFICATIONS ══════════════════ */}
        {activeTab === "notifications" && (
          <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-900/[0.03]">
            <h2 className="text-base font-semibold text-slate-900">Notification channels</h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose how you want to receive updates about tickets and campus events.
            </p>

            <div className="mt-5 space-y-3">
              {/* In-app toggle card */}
              <div className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors ${
                inApp ? "border-indigo-200 bg-indigo-50/50" : "border-slate-100 bg-slate-50"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                    inApp ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"
                  }`}>
                    <Bell className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">In-app notifications</p>
                    <p className="text-xs text-slate-500">Bell panel, real-time feed, actionable alerts</p>
                  </div>
                </div>
                <Toggle
                  checked={inApp}
                  onChange={setInApp}
                  disabled={prefsQuery.isLoading || savePrefsMutation.isPending}
                />
              </div>

              {/* Email toggle card */}
              <div className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors ${
                emailEnabled ? "border-sky-200 bg-sky-50/50" : "border-slate-100 bg-slate-50"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                    emailEnabled ? "bg-sky-100 text-sky-600" : "bg-slate-100 text-slate-400"
                  }`}>
                    <Mail className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Email notifications</p>
                    <p className="text-xs text-slate-500">{user?.email ?? "your registered address"}</p>
                  </div>
                </div>
                <Toggle
                  checked={emailEnabled}
                  onChange={setEmailEnabled}
                  disabled={prefsQuery.isLoading || savePrefsMutation.isPending}
                />
              </div>
            </div>

            {/* Muted warning */}
            {!inApp && !emailEnabled && (
              <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <BellOff className="h-4 w-4 shrink-0 text-amber-600" strokeWidth={2} />
                <p className="text-xs font-medium text-amber-700">
                  All notifications are muted — you may miss important updates.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => savePrefsMutation.mutate({ inAppEnabled: inApp, emailEnabled })}
              disabled={!user?.id || prefsQuery.isLoading || savePrefsMutation.isPending}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-campus-brand py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-campus-brand-hover disabled:opacity-60"
            >
              {savePrefsMutation.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Save className="h-4 w-4" strokeWidth={2} />}
              {savePrefsMutation.isPending ? "Saving…" : "Save preferences"}
            </button>
          </div>
        )}

        {/* ══════════════════ TAB: ACCOUNT ══════════════════ */}
        {activeTab === "account" && (
          <div className="mt-5 space-y-4">
            {/* Account details */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-900/[0.03]">
              <h2 className="text-base font-semibold text-slate-900">Account details</h2>
              <p className="mt-1 text-sm text-slate-500">
                Managed by the system. Contact an admin to change access or roles.
              </p>
              <div className="mt-4">
                <FieldRow icon={Mail}        label="Email address"  value={user?.email} />
                <FieldRow icon={ShieldCheck} label="Roles"          value={rolesArray.join(", ")} />
                <FieldRow icon={User}        label="Sign-in method" value={providerLabel(user?.provider)} />
                <FieldRow icon={CalendarDays}label="Member since"   value={formatJoined(user?.createdAt)} />
              </div>
            </div>

            {/* Activity summary */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-900/[0.03]">
              <h2 className="text-base font-semibold text-slate-900">Activity summary</h2>
              <div className="mt-4 divide-y divide-slate-50">
                <div className="flex items-center justify-between py-3.5">
                  <div className="flex items-center gap-2.5 text-sm text-slate-700">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
                      <Ticket className="h-3.5 w-3.5" strokeWidth={2} />
                    </div>
                    Tickets you reported
                  </div>
                  <span className="text-sm font-bold tabular-nums text-slate-900">
                    {myTicketsQuery.isLoading
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                      : (myTotal ?? "—")}
                  </span>
                </div>
                {isTech && (
                  <div className="flex items-center justify-between py-3.5">
                    <div className="flex items-center gap-2.5 text-sm text-slate-700">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-500">
                        <ClipboardList className="h-3.5 w-3.5" strokeWidth={2} />
                      </div>
                      Assigned to you
                    </div>
                    <span className="text-sm font-bold tabular-nums text-slate-900">
                      {assignedQuery.isLoading
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                        : (assignedTotal ?? "—")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
