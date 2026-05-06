"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CircleUserRound, LogOut, Siren } from "lucide-react";
import { appNavByRole } from "@/lib/data/mock";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth-store";
import { apiFetch } from "@/lib/api/client";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { role, tier, phoneMasked, setSession } = useAuthStore();
  const appNav = appNavByRole[role];

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // ignore logout failures and still clear local session
    }

    setSession({
      isAuthenticated: false,
      isLoading: false,
      role: "user",
      tier: "free",
      phoneMasked: "",
      onboardingCompleted: false
    });
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-surface-stroke/20 bg-[#f3f5f3] px-4 py-8 md:flex">
        <Link href={role === "therapist" ? "/therapist" : role === "org_admin" ? "/org-admin" : role === "super_admin" ? "/super-admin" : "/dashboard"} className="px-4 font-heading text-3xl font-semibold text-primary">
          MindGod
        </Link>
        <p className="px-4 pt-2 text-sm text-foreground/60">
          {role === "user"
            ? "Your inner sanctuary"
            : role === "therapist"
            ? "Therapist operations"
            : role === "org_admin"
            ? "Organization wellbeing"
            : "Platform operations"}
        </p>
        <nav className="mt-8 space-y-2">
          {appNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-full px-4 py-3 text-sm text-foreground/70 transition",
                pathname === href ? "bg-primary text-white" : "hover:bg-white/80 hover:text-primary"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-4 p-4">
          <div className="rounded-[24px] bg-coral/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">{role.replace("_", " ")}</p>
            <p className="mt-2 text-sm text-foreground/80">{phoneMasked || tier}</p>
          </div>
          <Link href="/crisis" className="block">
            <Button variant="crisis" className="w-full gap-2">
              <Siren className="h-4 w-4" />
              Crisis Support
            </Button>
          </Link>
          <Button variant="outline" className="w-full gap-2" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>
      <div className="md:ml-72">
        <header className="sticky top-0 z-40 border-b border-surface-stroke/30 bg-background/80 backdrop-blur-xl">
          <div className="container flex items-center justify-between py-4">
            <div>
              <p className="font-heading text-xl font-semibold text-primary">MindGod</p>
              <p className="text-xs text-primary/70">{role.replace("_", " ")} portal</p>
            </div>
            <div className="flex items-center gap-4 text-primary">
              <Link href="/notifications">
                <Bell className="h-5 w-5" />
              </Link>
              <Link href="/profile">
                <CircleUserRound className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </header>
        <main className="container py-8">{children}</main>
      </div>
    </div>
  );
}
