import { AppShell } from "@/components/layout/app-shell";
import { ProtectedGuard } from "@/components/layout/protected-guard";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedGuard>
      <AppShell>{children}</AppShell>
    </ProtectedGuard>
  );
}
