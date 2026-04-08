import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { fetchUsers, toggleUserEnabled } from "../../api/userAdminApi";

const ROLE_OPTIONS = ["USER", "ADMIN", "TECHNICIAN"];

function rolesLabel(roles) {
  if (!roles?.length) return "—";
  return [...roles].sort().join(", ");
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState("");

  const usersQuery = useQuery({
    queryKey: ["admin", "users", "all"],
    queryFn: () => fetchUsers({}),
  });

  const sortedUsers = useMemo(() => {
    const list = Array.isArray(usersQuery.data) ? [...usersQuery.data] : [];
    const filtered = roleFilter
      ? list.filter((row) => {
          const rolesArr = row.roles
            ? Array.isArray(row.roles)
              ? row.roles
              : [...row.roles]
            : [];
          return rolesArr.includes(roleFilter);
        })
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
      toast.success("Account status updated");
    },
    onError: () => {
      toast.error("Could not update account status");
    },
  });

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
          Roles are shown for reference only and cannot be changed here. You can enable or disable
          sign-in for other accounts; you cannot change your own status from this screen.
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
                    <th className="px-4 py-3 sm:px-6">Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {sortedUsers.map((row) => {
                    const rolesArr = row.roles
                      ? Array.isArray(row.roles)
                        ? row.roles
                        : [...row.roles]
                      : [];
                    const isSelf = currentUser?.id != null && row.id === currentUser.id;
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
                          <label className="inline-flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-slate-300 text-campus-brand focus:ring-campus-brand disabled:cursor-not-allowed disabled:opacity-50"
                              checked={Boolean(row.enabled)}
                              disabled={isSelf || enableMutation.isPending}
                              onChange={() => enableMutation.mutate(row.id)}
                              aria-label={`Account active for ${row.email}`}
                            />
                            <span className="text-xs text-slate-600">
                              {row.enabled ? "Enabled" : "Disabled"}
                            </span>
                          </label>
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
