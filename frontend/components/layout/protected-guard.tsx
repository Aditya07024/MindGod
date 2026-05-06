"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";

export function ProtectedGuard({
  children,
  roles
}: {
  children: React.ReactNode;
  roles?: Array<"user" | "therapist" | "org_admin" | "super_admin">;
}) {
  const { isAuthenticated, isLoading, role } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) router.replace("/onboarding");
    else if (roles && !roles.includes(role)) {
      const home =
        role === "super_admin"
          ? "/super-admin"
          : role === "org_admin"
          ? "/org-admin"
          : role === "therapist"
          ? "/therapist"
          : "/dashboard";
      router.replace(home);
    }
  }, [isAuthenticated, isLoading, role, roles, router]);

  if (isLoading || !isAuthenticated || (roles && !roles.includes(role))) return null;

  return children;
}
