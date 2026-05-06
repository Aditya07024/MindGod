import { ProtectedGuard } from "@/components/layout/protected-guard";
import { OrgAdminPortalPage } from "@/components/portals/portal-pages";

export default function OrgAnalyticsPage() {
  return (
    <ProtectedGuard roles={["org_admin", "super_admin"]}>
      <OrgAdminPortalPage />
    </ProtectedGuard>
  );
}
