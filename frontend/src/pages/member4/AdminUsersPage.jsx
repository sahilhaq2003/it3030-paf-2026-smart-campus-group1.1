import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { deleteUser, fetchUsers, toggleUserEnabled } from "../../api/userAdminApi";

const ROLE_OPTIONS = ["USER", "ADMIN", "TECHNICIAN"];

function rolesArrayFromRow(row) {
  if (!row?.roles) return [];
  return Array.isArray(row.roles) ? row.roles : [...row.roles];
}

function rolesLabel(roles) {
  if (!roles?.length) return "—";
  return [...roles].sort().join(", ");
}

function isStaffProtectedFromRemoval(roles) {
  const s = new Set(roles ?? []);
  return s.has("ADMIN") || s.has("MANAGER");
}

function apiErrorMessage(error, fallback) {
  const d = error?.response?.data;
  if (typeof d === "string" && d.trim()) return d;
  if (d && typeof d === "object") {
    const msg = d.detail ?? d.message ?? d.error;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return fallback;
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState("");

  const usersQuery = useQuery({
    queryKey: ["admin", "users", "all"],
    queryFn: () => fetchUsers({}),
  });

  const userSummary = useMemo(() => {
    const list = Array.isArray(usersQuery.data) ? usersQuery.data : [];
    let admins = 0;
    let managers = 0;
    let technicians = 0;
    let users = 0;
    for (const row of list) {
      const rs = new Set(rolesArrayFromRow(row));
      if (rs.has("ADMIN")) admins += 1;
      if (rs.has("MANAGER")) managers += 1;
      if (rs.has("TECHNICIAN")) technicians += 1;
      if (rs.has("USER")) users += 1;
    }
    return { total: list.length, admins, managers, technicians, users };
  }, [usersQuery.data]);

  const sortedUsers = useMemo(() => {
    const list = Array.isArray(usersQuery.data) ? [...usersQuery.data] : [];
    const filtered = roleFilter
      ? list.filter((row) => rolesArrayFromRow(row).includes(roleFilter))
      : list;
    return filtered.sort((a, b) =>
      String(a.email).localeCompare(String(b.email), undefined, {
        sensitivity: "base",
      }),
    );
  }, [usersQuery.data, roleFilter]);

  const enableMutation = useMutation({
    mutationFn: (id) => toggleUserEnabled(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"], exact: false });
      toast.success("Account access updated");
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Could not update account access"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"], exact: false });
      toast.success("User removed");
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Could not remove user"));
    },
  });

  const accessBusyId = enableMutation.isPending ? enableMutation.variables : null;
  const removeBusyId = deleteMutation.isPending ? deleteMutation.variables : null;

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
      <div className="relative mx-auto max-w-6xl px-6 py-8 sm:py-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Administration
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Users
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Roles are shown for reference only and cannot be changed here. You can block or unblock
          sign-in for other accounts, or remove accounts that are not administrators or managers.
          You cannot change your own access from this screen.
        </p>

        <div className="mt-6 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
            <div>
              <p className="text-xs font-medium text-slate-600">Filter by role</p>
              <div
                className="mt-2 flex flex-wrap gap-2"
                role="group"
                aria-label="Quick filter by role"
              >
                <button
                  type="button"
                  onClick={() => setRoleFilter("")}
                  aria-pressed={roleFilter === ""}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-brand ${
                    roleFilter === ""
                      ? "border-campus-brand bg-campus-brand text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  All
                </button>
                {ROLE_OPTIONS.map((r) => {
                  const selected = roleFilter === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRoleFilter(r)}
                      aria-pressed={selected}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-campus-brand ${
                        selected
                          ? "border-campus-brand bg-campus-brand text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="admin-users-role-filter" className="text-xs font-medium text-slate-600">
                More options
              </label>
              <select
                id="admin-users-role-filter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none ring-campus-brand/20 focus:border-campus-brand focus:ring-2"
              >
                <option value="">All roles</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {!usersQuery.isLoading && !usersQuery.isError ? (
          <section
            className="mt-8 rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm ring-1 ring-slate-900/[0.03] sm:px-6"
            aria-label="User directory summary"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Summary
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {[
                ["Total users", userSummary.total],
                ["Admins", userSummary.admins],
                ["Managers", userSummary.managers],
                ["Technicians", userSummary.technicians],
                ["Users", userSummary.users],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5"
                >
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    {label}
                  </dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-900/[0.03]">
          {usersQuery.isLoading ? (
            <div className="flex justify-center py-20">
              <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-campus-brand" />
            </div>
          ) : usersQuery.isError ? (
            <p className="px-6 py-10 text-center text-sm text-red-600">
              Failed to load users. Check that you are signed in as an administrator.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 sm:px-6">User</th>
                    <th className="px-4 py-3 sm:px-6">Roles</th>
                    <th className="px-4 py-3 sm:px-6">Access</th>
                    <th className="px-4 py-3 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {sortedUsers.map((row) => {
                    const rolesArr = rolesArrayFromRow(row);
                    const isSelf = currentUser?.id != null && row.id === currentUser.id;
                    const rowAccessBusy = accessBusyId === row.id;
                    const rowRemoveBusy = removeBusyId === row.id;
                    const canToggleAccess = !isSelf && !enableMutation.isPending;
                    const canRemove =
                      !isSelf &&
                      !isStaffProtectedFromRemoval(rolesArr) &&
                      !deleteMutation.isPending;
                    return (
                      <tr key={row.id} className="text-slate-800">
                        <td className="px-4 py-3 sm:px-6">
                          <p className="font-medium text-slate-900">{row.name ?? "—"}</p>
                          <p className="text-xs text-slate-500">{row.email}</p>
                        </td>
                        <td className="max-w-[14rem] px-4 py-3 text-xs font-medium text-slate-700 sm:max-w-none">
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-800">
                            {rolesLabel(rolesArr)}
                          </span>
                        </td>
                        <td className="px-4 py-3 sm:px-6">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                            <span
                              className={`inline-flex w-fit rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                                row.enabled
                                  ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/15"
                                  : "bg-amber-50 text-amber-900 ring-1 ring-amber-600/20"
                              }`}
                            >
                              {row.enabled ? "Active" : "Blocked"}
                            </span>
                            {row.enabled ? (
                              <button
                                type="button"
                                disabled={!canToggleAccess}
                                onClick={() => enableMutation.mutate(row.id)}
                                className="w-fit rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {rowAccessBusy ? "…" : "Block"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={!canToggleAccess}
                                onClick={() => enableMutation.mutate(row.id)}
                                className="w-fit rounded-lg border border-campus-brand/40 bg-campus-brand/5 px-2.5 py-1 text-xs font-semibold text-campus-brand shadow-sm transition hover:bg-campus-brand/10 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {rowAccessBusy ? "…" : "Unblock"}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 sm:px-6">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              disabled={!canRemove}
                              title={
                                isSelf
                                  ? "You cannot remove your own account"
                                  : isStaffProtectedFromRemoval(rolesArr)
                                    ? "Administrator and manager accounts cannot be removed here"
                                    : undefined
                              }
                              onClick={() => {
                                if (
                                  !window.confirm(
                                    `Remove account ${row.email}? This cannot be undone.`,
                                  )
                                ) {
                                  return;
                                }
                                deleteMutation.mutate(row.id);
                              }}
                              className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-700 shadow-sm transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {rowRemoveBusy ? "…" : "Remove"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
