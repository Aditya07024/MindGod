import { ProtectedGuard } from "@/components/layout/protected-guard";
import { TherapistPortalPage } from "@/components/portals/portal-pages";

export default function TherapistPortalAdminPage() {
  return (
    <ProtectedGuard roles={["therapist", "super_admin"]}>
      <TherapistPortalPage />
    </ProtectedGuard>
  );
}
