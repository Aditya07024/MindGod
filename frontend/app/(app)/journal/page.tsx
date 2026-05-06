import { ProtectedGuard } from "@/components/layout/protected-guard";
import { JournalPage } from "@/components/journal/journal-page";

export default function JournalRoutePage() {
  return (
    <ProtectedGuard>
      <JournalPage />
    </ProtectedGuard>
  );
}
