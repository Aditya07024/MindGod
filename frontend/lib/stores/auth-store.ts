"use client";

import { create } from "zustand";

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  role: "user" | "therapist" | "org_admin" | "super_admin";
  tier: "free" | "mann_shanti" | "apna_therapist";
  phoneMasked: string;
  onboardingCompleted: boolean;
  setSession: (payload: Partial<AuthState>) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  role: "user",
  tier: "free",
  phoneMasked: "",
  onboardingCompleted: false,
  setSession: (payload) => set((state) => ({ ...state, ...payload }))
}));
