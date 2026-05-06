import { ProtectedGuard } from "@/components/layout/protected-guard";
import { TherapistPortalPage } from "@/components/portals/portal-pages";

export default function TherapistPage() {
  return (
    <ProtectedGuard roles={["therapist"]}>
      <TherapistPortalPage />
    </ProtectedGuard>
  );
}
