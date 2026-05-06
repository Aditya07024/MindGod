import { ProtectedGuard } from "@/components/layout/protected-guard";
import { CrisisSupportPage } from "@/components/experience/support-pages";

export default function CrisisRoutePage() {
  return (
    <ProtectedGuard>
      <CrisisSupportPage />
    </ProtectedGuard>
  );
}
