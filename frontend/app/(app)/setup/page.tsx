import { ProtectedGuard } from "@/components/layout/protected-guard";
import { SetupPage } from "@/components/experience/support-pages";

export default function SetupRoutePage() {
  return (
    <ProtectedGuard>
      <SetupPage />
    </ProtectedGuard>
  );
}
