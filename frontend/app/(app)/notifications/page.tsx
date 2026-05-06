import { ProtectedGuard } from "@/components/layout/protected-guard";
import { NotificationsPage } from "@/components/experience/support-pages";

export default function NotificationsRoutePage() {
  return (
    <ProtectedGuard>
      <NotificationsPage />
    </ProtectedGuard>
  );
}
