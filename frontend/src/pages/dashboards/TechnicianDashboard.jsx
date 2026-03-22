import {
  DashboardPageLayout,
  DashboardSection,
  DashboardStatCard,
  PlaceholderBlock,
} from "../../components/dashboard/DashboardPrimitives";

export default function TechnicianDashboard() {
  return (
    <DashboardPageLayout
      eyebrow="Technician · Dashboard"
      title="Field work queue"
      subtitle="Prioritized assignments and route-friendly summaries. Data will sync with work orders and asset records."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardStatCard label="Assigned to me" value="—" hint="Placeholder" />
        <DashboardStatCard label="Due today" value="—" hint="Placeholder" />
        <DashboardStatCard label="Completed (week)" value="—" hint="Placeholder" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="Today’s jobs"
          description="Ordered by priority and location (placeholder)."
        >
          <PlaceholderBlock>
            Work order list will render here with filters and maps.
          </PlaceholderBlock>
        </DashboardSection>

        <DashboardSection
          title="Parts & notes"
          description="Quick reference for recurring sites and equipment."
        >
          <PlaceholderBlock>
            Inventory links and technician notes will appear here.
          </PlaceholderBlock>
        </DashboardSection>
      </div>

      <div className="mt-6">
        <DashboardSection
          title="Performance snapshot"
          description="Personal KPIs vs. team averages (placeholder)."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <PlaceholderBlock>Resolution time trend</PlaceholderBlock>
            <PlaceholderBlock>Customer feedback summary</PlaceholderBlock>
          </div>
        </DashboardSection>
      </div>
    </DashboardPageLayout>
  );
}
