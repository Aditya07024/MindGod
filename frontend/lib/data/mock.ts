import { Bell, Brain, BriefcaseBusiness, CalendarCheck, CircleUserRound, HeartPulse, LineChart, ShieldCheck, Sparkles, Wind } from "lucide-react";
import type { NavItem } from "@/types";

export const marketingNav: NavItem[] = [
  { href: "#features", label: "Features" },
  { href: "#stories", label: "Stories" },
  { href: "/pricing", label: "Pricing" },
  { href: "/onboarding", label: "Begin" }
];

export const appNavByRole = {
  user: [
    { href: "/dashboard", label: "Dashboard", icon: Sparkles },
    { href: "/chat", label: "Manas Chat", icon: Brain },
    { href: "/therapists", label: "Book Therapist", icon: CalendarCheck },
    { href: "/mood", label: "Mood Insights", icon: LineChart },
    { href: "/journal", label: "CBT Journal", icon: HeartPulse },
    { href: "/breathing", label: "Breathing", icon: Wind },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/profile", label: "Profile", icon: CircleUserRound }
  ],
  therapist: [
    { href: "/therapist", label: "Portal Home", icon: BriefcaseBusiness },
    { href: "/therapists", label: "Marketplace", icon: CalendarCheck },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/profile", label: "Profile", icon: CircleUserRound }
  ],
  org_admin: [
    { href: "/org-admin", label: "Org Dashboard", icon: BriefcaseBusiness },
    { href: "/dashboard", label: "User View", icon: Sparkles },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/profile", label: "Profile", icon: CircleUserRound }
  ],
  super_admin: [
    { href: "/super-admin", label: "Ops Dashboard", icon: ShieldCheck },
    { href: "/org-analytics", label: "Org Analytics", icon: LineChart },
    { href: "/therapist-portal", label: "Therapist Portal", icon: BriefcaseBusiness },
    { href: "/dashboard", label: "User View", icon: Sparkles },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/profile", label: "Profile", icon: CircleUserRound }
  ]
} as const;
