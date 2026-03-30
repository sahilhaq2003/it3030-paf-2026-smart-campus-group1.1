import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { format, parseISO } from "date-fns";
import { useAuth } from "../../context/AuthContext";
import { ticketApi } from "../../api/ticketApi";
import { normalizeRoles } from "../../utils/getDashboardRoute";

function formatJoined(iso) {
  if (iso == null || iso === "") return "—";
  try {
    return format(parseISO(iso), "PPP");
  } catch {
    return "—";
  }
}

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const roles = user?.roles ?? (user?.role != null ? [user.role] : []);
  const roleSet = normalizeRoles(roles);
  const isTechnician = roleSet.has("TECHNICIAN");

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setAvatarUrl(user.avatarUrl ?? "");
    }
  }, [user]);

  const myTicketsQuery = useQuery({
    queryKey: ["profile", "myTicketsCount", user?.id],
    queryFn: () => ticketApi.getMyTickets({ page: 0, size: 1 }).then((r) => r.data),
    enabled: Boolean(user?.id),
  });

  const assignedQuery = useQuery({
    queryKey: ["profile", "assignedCount", user?.id],
    queryFn: () =>
      ticketApi.getAssignedTickets({ page: 0, size: 1 }).then((r) => r.data),
    enabled: Boolean(user?.id) && isTechnician,
  });

  const myTicketsTotal = myTicketsQuery.data?.totalElements;
  const assignedTotal = assignedQuery.data?.totalElements;

  const rolesLabel = useMemo(
    () =>
      [...roleSet].sort().join(", ") || "—",
    [roleSet],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name: trimmed, avatarUrl });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative min-h-full bg-slate-100">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.3]"
        aria-hidden
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(203 213 225 / 0.5) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative mx-auto max-w-3xl px-6 py-8 sm:py-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Account
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Your profile
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
          Update how you appear in Smart Campus. Role and email come from your account; contact an
          admin to change access.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <section className="lg:col-span-3 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-900/[0.03]">
            <h2 className="text-sm font-semibold text-slate-900">Display &amp; avatar</h2>
            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="profile-name" className="block text-xs font-medium text-slate-600">
                  Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-campus-brand/30 transition focus:border-campus-brand focus:ring-2"
                />
              </div>
              <div>
                <label
                  htmlFor="profile-avatar"
                  className="block text-xs font-medium text-slate-600"
                >
                  Avatar URL <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  id="profile-avatar"
                  type="url"
                  inputMode="url"
                  placeholder="https://…"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-campus-brand/30 transition focus:border-campus-brand focus:ring-2"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-lg bg-campus-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-campus-brand-hover disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </form>
          </section>

          <aside className="space-y-4 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-900/[0.03]">
              <h2 className="text-sm font-semibold text-slate-900">Account details</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Email
                  </dt>
                  <dd className="mt-0.5 text-slate-800">{user?.email ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Roles
                  </dt>
                  <dd className="mt-0.5 text-slate-800">{rolesLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Sign-in
                  </dt>
                  <dd className="mt-0.5 text-slate-800">{user?.provider ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Member since
                  </dt>
                  <dd className="mt-0.5 text-slate-800">
                    {formatJoined(user?.createdAt)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-900/[0.03]">
              <h2 className="text-sm font-semibold text-slate-900">Activity summary</h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                <li className="flex justify-between gap-3">
                  <span>Tickets you reported</span>
                  <span className="font-semibold tabular-nums text-slate-900">
                    {myTicketsQuery.isLoading ? "…" : (myTicketsTotal ?? "—")}
                  </span>
                </li>
                {isTechnician ? (
                  <li className="flex justify-between gap-3">
                    <span>Assigned to you</span>
                    <span className="font-semibold tabular-nums text-slate-900">
                      {assignedQuery.isLoading ? "…" : (assignedTotal ?? "—")}
                    </span>
                  </li>
                ) : null}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
