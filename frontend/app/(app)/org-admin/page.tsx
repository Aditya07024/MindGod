import { ProtectedGuard } from "@/components/layout/protected-guard";
import { OrgAdminPortalPage } from "@/components/portals/portal-pages";

export default function OrgAdminPage() {
  return (
    <ProtectedGuard roles={["org_admin"]}>
      <OrgAdminPortalPage />
    </ProtectedGuard>
  );
}
