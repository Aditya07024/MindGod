"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";

const PUBLIC_PATHS = ["/", "/pricing", "/therapists", "/portals"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    let mounted = true;

    const currentPath = pathname ?? "/";
    const shouldSkipSessionFetch = PUBLIC_PATHS.some(
      (publicPath) => currentPath === publicPath || currentPath.startsWith(`${publicPath}/`)
    );

    if (shouldSkipSessionFetch) {
      setSession({ isLoading: false } as never);
      return () => { mounted = false; };
    }

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api"}/auth/me`, {
      credentials: "include",
      cache: "no-store"
    })
      .then(async (response) => {
        if (response.status === 401) return null;
        if (!response.ok) throw new Error("Failed to fetch session");
        return response.json() as Promise<{
          user: {
            role: "user" | "therapist" | "org_admin" | "super_admin";
            tier: "free" | "mann_shanti" | "apna_therapist";
            phoneMasked: string;
            onboarding?: { completedAt?: string };
          };
        }>;
      })
      .then((data) => {
        if (!mounted) return;
        if (!data) {
          setSession({
            isAuthenticated: false,
            isLoading: false,
            role: "user",
            tier: "free",
            phoneMasked: "",
            onboardingCompleted: false
          });
          return;
        }
        setSession({
          isAuthenticated: true,
          isLoading: false,
          role: data.user.role,
          tier: data.user.tier,
          phoneMasked: data.user.phoneMasked,
          onboardingCompleted: Boolean(data.user.onboarding?.completedAt)
        });
      })
      .catch(() => {
        if (!mounted) return;
        setSession({
          isAuthenticated: false,
          isLoading: false,
          role: "user",
          tier: "free",
          phoneMasked: "",
          onboardingCompleted: false
        });
      });

    return () => { mounted = false; };
  }, [pathname, setSession]);

  return children;
}
