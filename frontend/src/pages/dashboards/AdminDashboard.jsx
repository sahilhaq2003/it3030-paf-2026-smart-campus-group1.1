import {
  DashboardPageLayout,
  DashboardSection,
  DashboardStatCard,
  PlaceholderBlock,
} from "../../components/dashboard/DashboardPrimitives";

export default function AdminDashboard() {
  return (
    <DashboardPageLayout
      eyebrow="Admin · Dashboard"
      title="Operations control"
      subtitle="High-level visibility across tickets, users, and SLAs. Charts and tables will populate from the admin API."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard label="Total open" value="—" hint="Placeholder" />
        <DashboardStatCard label="SLA at risk" value="—" hint="Placeholder" />
        <DashboardStatCard label="Active users" value="—" hint="Placeholder" />
        <DashboardStatCard label="Avg. resolution" value="—" hint="Placeholder" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardSection
            title="Ticket volume"
            description="Trends by status and priority (placeholder chart area)."
          >
            <PlaceholderBlock>
              Chart / reporting component will mount here.
            </PlaceholderBlock>
          </DashboardSection>
        </div>

        <DashboardSection
          title="System health"
          description="Integration and job status at a glance."
        >
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <span className="text-slate-600">API</span>
              <span className="font-medium text-emerald-600">OK</span>
            </li>
            <li className="flex justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <span className="text-slate-600">Notifications</span>
              <span className="font-medium text-slate-400">—</span>
            </li>
            <li className="flex justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <span className="text-slate-600">Schedulers</span>
              <span className="font-medium text-slate-400">—</span>
            </li>
          </ul>
        </DashboardSection>
      </div>

      <div className="mt-6">
        <DashboardSection
          title="Recent admin actions"
          description="Audit-style log (placeholder)."
        >
          <PlaceholderBlock>
            Action history will list here after backend integration.
          </PlaceholderBlock>
        </DashboardSection>
      </div>
    </DashboardPageLayout>
  );
}
