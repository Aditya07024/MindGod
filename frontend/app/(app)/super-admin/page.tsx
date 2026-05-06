import { ProtectedGuard } from "@/components/layout/protected-guard";
import { SuperAdminPortalPage } from "@/components/portals/portal-pages";

export default function SuperAdminPage() {
  return (
    <ProtectedGuard roles={["super_admin"]}>
      <SuperAdminPortalPage />
    </ProtectedGuard>
  );
}
