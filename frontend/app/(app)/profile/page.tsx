import { ProtectedGuard } from "@/components/layout/protected-guard";
import { ProfilePage } from "@/components/experience/support-pages";

export default function ProfileRoutePage() {
  return (
    <ProtectedGuard>
      <ProfilePage />
    </ProtectedGuard>
  );
}
