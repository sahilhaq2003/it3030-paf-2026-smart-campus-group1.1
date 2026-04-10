import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Wrench, UserPlus, Pencil, Trash2 } from "lucide-react";
import {
  createTechnician,
  deleteTechnician,
  fetchTechnicians,
  updateTechnician,
} from "../../api/userAdminApi";
import ConfirmModal from "../ConfirmModal";
import {
  DashboardSection,
  campusBtnPrimary,
  campusInputFocus,
  dashboardCardShell,
} from "./DashboardPrimitives";
import { DashboardInlineMessage } from "./DashboardCards";
import { TECHNICIAN_CATEGORIES, technicianCategoryLabel } from "../../constants/technicianCategories";

const inputClass = `mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm ${campusInputFocus}`;
const selectClass = `${inputClass} appearance-none bg-[length:1rem_1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10`;

export default function AdminTechnicianPanel() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [category, setCategory] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editCategory, setEditCategory] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);

  const techniciansQuery = useQuery({
    queryKey: ["admin", "technicians"],
    queryFn: fetchTechnicians,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createTechnician({
        email: email.trim(),
        name: name.trim(),
        password: password.trim(),
        technicianCategory: category,
      }),
    onSuccess: () => {
      toast.success("Technician account created");
      setEmail("");
      setName("");
      setPassword("");
      setCategory("");
      queryClient.invalidateQueries({ queryKey: ["admin", "technicians"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", "count"] });
    },
    onError: (err) => {
      const data = err?.response?.data;
      const fieldErrors = data?.errors;
      let msg =
        data?.message ||
        (typeof data === "string" ? data : null) ||
        err?.message ||
        "Could not create technician";
      if (fieldErrors && typeof fieldErrors === "object") {
        const first = Object.entries(fieldErrors)[0];
        if (first) msg = `${first[0]}: ${first[1]}`;
      }
      toast.error(typeof msg === "string" ? msg : "Could not create technician");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => updateTechnician(id, body),
    onSuccess: () => {
      toast.success("Technician updated");
      setEditOpen(false);
      setEditId(null);
      setEditPassword("");
      queryClient.invalidateQueries({ queryKey: ["admin", "technicians"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err) => {
      const data = err?.response?.data;
      const msg =
        data?.message ||
        (typeof data === "string" ? data : null) ||
        err?.message ||
        "Could not update technician";
      toast.error(typeof msg === "string" ? msg : "Could not update technician");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteTechnician(id),
    onSuccess: () => {
      toast.success("Technician removed");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "technicians"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "tickets", "list"] });
    },
    onError: (err) => {
      const data = err?.response?.data;
      const msg =
        data?.message ||
        (typeof data === "string" ? data : null) ||
        err?.message ||
        "Could not delete technician";
      toast.error(typeof msg === "string" ? msg : "Could not delete technician");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !name.trim() || !category || !password.trim() || password.trim().length < 8) {
      toast.error("Fill all fields including category; password at least 8 characters");
      return;
    }
    createMutation.mutate();
  };

  const openEdit = (t) => {
    setEditId(t.id);
    setEditName(t.name ?? "");
    setEditEmail(t.email ?? "");
    setEditPassword("");
    setEditCategory(t.technicianCategory ?? "OTHER");
    setEditOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim()) {
      toast.error("Name and email are required");
      return;
    }
    if (!editCategory) {
      toast.error("Select a technician category");
      return;
    }
    const body = {
      name: editName.trim(),
      email: editEmail.trim(),
      technicianCategory: editCategory,
    };
    if (editPassword.trim().length > 0) {
      if (editPassword.trim().length < 8) {
        toast.error("New password must be at least 8 characters, or leave blank");
        return;
      }
      body.password = editPassword.trim();
    }
    updateMutation.mutate({ id: editId, body });
  };

  const techs = techniciansQuery.data ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
      <DashboardSection
        title="Create technician account"
        description="Technicians sign in with email and password. They appear in ticket assignment lists."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="tech-name" className="text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              id="tech-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className={inputClass}
              placeholder="e.g. Alex Rivera"
            />
          </div>
          <div>
            <label htmlFor="tech-email" className="text-sm font-medium text-slate-700">
              Work email
            </label>
            <input
              id="tech-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className={inputClass}
              placeholder="technician@campus.edu"
            />
          </div>
          <div>
            <label htmlFor="tech-category" className="text-sm font-medium text-slate-700">
              Technician category
            </label>
            <select
              id="tech-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={selectClass}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
              }}
            >
              <option value="" disabled>
                Select a category…
              </option>
              {TECHNICIAN_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tech-password" className="text-sm font-medium text-slate-700">
              Initial password
            </label>
            <input
              id="tech-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className={inputClass}
              placeholder="At least 8 characters"
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm ${campusBtnPrimary}`}
          >
            <UserPlus className="h-4 w-4" strokeWidth={2} />
            {createMutation.isPending ? "Creating…" : "Create technician"}
          </button>
        </form>
      </DashboardSection>

      <section className={`${dashboardCardShell} p-6 sm:p-7`}>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Wrench className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Technician roster</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Edit details, reset passwords, or remove accounts. Open assignments are cleared when a technician is
              deleted.
            </p>
          </div>
        </div>
        <div className="mt-6">
          {techniciansQuery.isLoading ? (
            <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
          ) : techniciansQuery.error ? (
            <DashboardInlineMessage variant="error">
              Could not load technicians (admin session required).
            </DashboardInlineMessage>
          ) : techs.length === 0 ? (
            <DashboardInlineMessage>No technicians yet — create one on the left.</DashboardInlineMessage>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {techs.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{t.name}</p>
                    <p className="truncate text-slate-500">{t.email}</p>
                    {t.technicianCategory ? (
                      <p className="mt-1 text-xs font-medium text-slate-600">
                        {technicianCategoryLabel(t.technicianCategory)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(t)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                      aria-label={`Edit ${t.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ id: t.id, name: t.name })}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-50"
                      aria-label={`Delete ${t.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {editOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-tech-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 id="edit-tech-title" className="text-lg font-semibold text-slate-900">
              Edit technician
            </h3>
            <p className="mt-1 text-sm text-slate-600">Update name, email, or set a new password.</p>
            <form onSubmit={handleSaveEdit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="edit-tech-name" className="text-sm font-medium text-slate-700">
                  Full name
                </label>
                <input
                  id="edit-tech-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={inputClass}
                  autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="edit-tech-email" className="text-sm font-medium text-slate-700">
                  Work email
                </label>
                <input
                  id="edit-tech-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className={inputClass}
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="edit-tech-category" className="text-sm font-medium text-slate-700">
                  Technician category
                </label>
                <select
                  id="edit-tech-category"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className={selectClass}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                  }}
                >
                  <option value="" disabled>
                    Select a category…
                  </option>
                  {TECHNICIAN_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.emoji} {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-tech-password" className="text-sm font-medium text-slate-700">
                  New password
                </label>
                <input
                  id="edit-tech-password"
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className={inputClass}
                  autoComplete="new-password"
                  placeholder="Leave blank to keep current"
                />
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditOpen(false);
                    setEditPassword("");
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${campusBtnPrimary}`}
                >
                  {updateMutation.isPending ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={!!deleteTarget}
        message={
          deleteTarget
            ? `Remove technician “${deleteTarget.name}”? Their ticket assignments will be cleared and their messages on tickets will be deleted. This cannot be undone.`
            : ""
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
      />
    </div>
  );
}
