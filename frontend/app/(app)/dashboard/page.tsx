import { DashboardView } from "@/components/dashboard/dashboard-view";
import { ProtectedGuard } from "@/components/layout/protected-guard";

export default function DashboardPage() {
  return (
    <ProtectedGuard>
      <DashboardView />
    </ProtectedGuard>
  );
}
