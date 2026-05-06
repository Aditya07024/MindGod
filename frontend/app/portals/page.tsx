"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth-store";

const portals = [
  { role: "user", title: "Individual User", href: "/dashboard" },
  { role: "therapist", title: "Therapist Portal", href: "/therapist" },
  { role: "org_admin", title: "Org Admin", href: "/org-admin" },
  { role: "super_admin", title: "Super Admin", href: "/super-admin" }
] as const;

export default function PortalsPage() {
  const router = useRouter();
  const { isAuthenticated, role, setSession } = useAuthStore();

  const openPortal = async (targetRole: (typeof portals)[number]["role"], href: string) => {
    if (!isAuthenticated) {
      router.push(`/onboarding?role=${targetRole}&next=${encodeURIComponent(href)}`);
      return;
    }

    if (role === targetRole) {
      router.push(href);
      return;
    }

    await apiFetch("/auth/logout", { method: "POST" }).catch(() => undefined);
    setSession({
      isAuthenticated: false,
      isLoading: false,
      role: "user",
      tier: "free",
      phoneMasked: "",
      onboardingCompleted: false
    });
    router.push(`/onboarding?role=${targetRole}&next=${encodeURIComponent(href)}`);
  };

  return (
    <main className="min-h-screen bg-breathing-glow px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="font-heading text-5xl text-primary">Portal Access</h1>
          <p className="mt-3 text-foreground/70">
            Choose a portal. If you are not signed in yet, we will take you straight to onboarding and then into the selected portal.
          </p>
      </div>

        <div className="grid gap-6 md:grid-cols-3">
          {portals.map((portal) => (
            <GlassCard key={portal.role}>
              <h2 className="font-heading text-2xl text-primary">{portal.title}</h2>
              <p className="mt-3 text-foreground/70">
                {!isAuthenticated
                  ? "Start OTP sign-in and go directly to this portal."
                  : role === portal.role
                  ? "Open your current portal."
                  : "This requires a separate login. We will sign you out first and then open this portal login."}
              </p>
              <Button className="mt-6 w-full" onClick={() => openPortal(portal.role, portal.href)}>
                {!isAuthenticated
                  ? `Continue to ${portal.title}`
                  : role === portal.role
                  ? `Open ${portal.title}`
                  : `Sign in separately for ${portal.title}`}
              </Button>
            </GlassCard>
          ))}
        </div>
      </div>
    </main>
  );
}
