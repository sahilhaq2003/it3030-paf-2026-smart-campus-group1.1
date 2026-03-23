import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Wrench, UserPlus } from "lucide-react";
import { createTechnician, fetchTechnicians } from "../../api/userAdminApi";
import {
  DashboardSection,
  campusBtnPrimary,
  campusInputFocus,
  dashboardCardShell,
} from "./DashboardPrimitives";
import { DashboardInlineMessage } from "./DashboardCards";

const inputClass = `mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm ${campusInputFocus}`;

export default function AdminTechnicianPanel() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const techniciansQuery = useQuery({
    queryKey: ["admin", "technicians"],
    queryFn: fetchTechnicians,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createTechnician({
        email: email.trim(),
        name: name.trim(),
        password,
      }),
    onSuccess: () => {
      toast.success("Technician account created");
      setEmail("");
      setName("");
      setPassword("");
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !name.trim() || password.length < 8) {
      toast.error("Fill all fields; password at least 8 characters");
      return;
    }
    createMutation.mutate();
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
              Use Admin tickets to assign open work to these technicians.
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
            <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {techs.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-col rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium text-slate-900">{t.name}</span>
                  <span className="text-slate-500">{t.email}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
