"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch("/users/me/dashboard")
  });
}
