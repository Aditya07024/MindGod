import { ProtectedGuard } from "@/components/layout/protected-guard";
import { MoodPage } from "@/components/mood/mood-page";

export default function MoodRoutePage() {
  return (
    <ProtectedGuard>
      <MoodPage />
    </ProtectedGuard>
  );
}
