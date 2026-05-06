import { BreathingPage } from "@/components/breathing/breathing-page";
import { ProtectedGuard } from "@/components/layout/protected-guard";

export default function BreathingRoutePage() {
  return (
    <ProtectedGuard>
      <BreathingPage />
    </ProtectedGuard>
  );
}
