import {
  DashboardPageLayout,
  DashboardSection,
  DashboardStatCard,
  PlaceholderBlock,
} from "../../components/dashboard/DashboardPrimitives";

export default function UserDashboard() {
  return (
    <DashboardPageLayout
      eyebrow="User · Dashboard"
      title="My campus overview"
      subtitle="Track your requests and stay on top of updates. Live metrics will connect here when APIs are wired."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardStatCard label="Open tickets" value="—" hint="Placeholder" />
        <DashboardStatCard label="Awaiting response" value="—" hint="Placeholder" />
        <DashboardStatCard label="Resolved (30d)" value="—" hint="Placeholder" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="Recent activity"
          description="Latest updates on tickets you've submitted or follow."
        >
          <PlaceholderBlock>
            Timeline and notifications will appear here (placeholder).
          </PlaceholderBlock>
        </DashboardSection>

        <DashboardSection
          title="Quick actions"
          description="Shortcuts to common tasks."
        >
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <span className="text-slate-400">→</span> Submit a new maintenance ticket
            </li>
            <li className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <span className="text-slate-400">→</span> View my open requests
            </li>
            <li className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <span className="text-slate-400">→</span> Update contact preferences
            </li>
          </ul>
        </DashboardSection>
      </div>

      <div className="mt-6">
        <DashboardSection
          title="Announcements"
          description="Campus-wide notices (placeholder)."
        >
          <PlaceholderBlock>
            No announcements to display yet.
          </PlaceholderBlock>
        </DashboardSection>
      </div>
    </DashboardPageLayout>
  );
}
