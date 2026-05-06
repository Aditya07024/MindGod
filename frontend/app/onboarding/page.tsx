"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth-store";

const concernsList = ["Work Stress", "Family", "Loneliness", "Health", "Relationships", "Money"];

const needs = [
  { id: "someone_to_talk_to", label: "Someone to talk to" },
  { id: "tools_and_exercises", label: "Tools & exercises" },
  { id: "just_to_express", label: "Just to express myself" }
] as const;

const roleLabels = {
  user: "user",
  therapist: "therapist",
  org_admin: "org admin",
  super_admin: "super admin"
} as const;

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, role: currentRole, onboardingCompleted, setSession } = useAuthStore();
  const requestedRole =
    (searchParams?.get("role") as "user" | "therapist" | "org_admin" | "super_admin" | null) ?? "user";
  const nextPath =
    searchParams?.get("next") ??
    (requestedRole === "user" ? "/chat" : `/${requestedRole.replace("_", "-")}`);
  const isWellnessUser = requestedRole === "user";
  const [step, setStep] = useState(1);
  const [moodScore, setMoodScore] = useState(6);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [primaryNeed, setPrimaryNeed] = useState<(typeof needs)[number]["id"]>("someone_to_talk_to");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [debugOtp, setDebugOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Returning user: already signed in with the correct role → skip everything
  useEffect(() => {
    if (isAuthenticated && onboardingCompleted && currentRole === requestedRole) {
      router.replace(nextPath);
    }
  }, [isAuthenticated, onboardingCompleted, currentRole, requestedRole, nextPath, router]);

  const toggleConcern = (label: string) => {
    setConcerns((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label]
    );
  };

  const persistOnboarding = async (completed = false) => {
    await apiFetch("/auth/onboarding", {
      method: "PATCH",
      body: JSON.stringify({ moodScore, concerns, primaryNeed, completed })
    });
  };

  const requestOtp = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch<{ otp?: string }>("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ phone })
      });
      setDebugOtp(response.otp ?? "");
      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch<{
        user: {
          role: "user" | "therapist" | "org_admin" | "super_admin";
          tier: "free" | "mann_shanti" | "apna_therapist";
          phoneMasked: string;
          onboarding: { completedAt?: string };
        };
      }>("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone, otp })
      });

      const isReturningUser = Boolean(response.user.onboarding?.completedAt);

      // Always sync the role to the requested portal role
      let finalRole = response.user.role;
      if (response.user.role !== requestedRole) {
        const roleResponse = await apiFetch<{
          user: {
            role: "user" | "therapist" | "org_admin" | "super_admin";
            tier: "free" | "mann_shanti" | "apna_therapist";
            phoneMasked: string;
            onboarding: { completedAt?: string };
          };
        }>("/auth/dev-role", {
          method: "POST",
          body: JSON.stringify({ role: requestedRole })
        });
        finalRole = roleResponse.user.role;
        setSession({
          isAuthenticated: true,
          isLoading: false,
          role: roleResponse.user.role,
          tier: roleResponse.user.tier,
          phoneMasked: roleResponse.user.phoneMasked,
          onboardingCompleted: isReturningUser
        });
      } else {
        setSession({
          isAuthenticated: true,
          isLoading: false,
          role: response.user.role,
          tier: response.user.tier,
          phoneMasked: response.user.phoneMasked,
          onboardingCompleted: isReturningUser
        });
      }

      if (isReturningUser) {
        // Returning user — skip setup and go straight to their portal
        setSession({ onboardingCompleted: true });
        router.replace(nextPath);
        return;
      }

      await persistOnboarding(true);
      setSession({ onboardingCompleted: true });
      setStep(6);
      const setupPath = `/setup?role=${finalRole}&next=${encodeURIComponent(nextPath)}`;
      setTimeout(() => router.replace(setupPath), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-breathing-glow px-6 py-10">
      <div className="mx-auto max-w-md space-y-6">
        {!isWellnessUser && (
          <GlassCard>
            <h1 className="font-heading text-4xl text-primary">
              {requestedRole === "therapist"
                ? "Therapist Sign In"
                : requestedRole === "org_admin"
                ? "Org Admin Sign In"
                : "Super Admin Sign In"}
            </h1>
            <p className="mt-3 text-foreground/70">
              Sign in directly to your portal. End-user mood onboarding is only for individual users.
            </p>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="9876543210"
              className="mt-6 h-14 w-full rounded-full bg-surface-low px-5 outline-none"
            />
            <input
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              placeholder="Enter OTP"
              className="mt-4 h-14 w-full rounded-full bg-surface-low px-5 outline-none"
            />
            {debugOtp ? <p className="mt-3 text-xs text-foreground/60">Dev OTP: {debugOtp}</p> : null}
            {error ? <p className="mt-3 text-sm text-crisis">{error}</p> : null}
            <div className="mt-8 grid gap-3">
              <Button variant="ghost" className="w-full" onClick={requestOtp} disabled={loading || phone.length < 10}>
                Send OTP
              </Button>
              <Button className="w-full gap-2" onClick={verifyOtp} disabled={loading || otp.length < 4}>
                Continue to Portal
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </GlassCard>
        )}

        {isWellnessUser && step === 1 && (
          <section className="rounded-[32px] bg-primary px-8 py-16 text-center text-white shadow-glow">
            <div className="mx-auto h-48 w-48 animate-breathe rounded-full bg-white/15" />
            <h1 className="mt-10 font-heading text-5xl">Apna Dil Kholo</h1>
            <p className="mt-4 text-white/80">This is your safe space to breathe, reflect, and find clarity.</p>
            <p className="mt-3 text-sm text-white/70">
              {requestedRole === "user"
                ? "Signing in to the user experience"
                : `Signing in to the ${roleLabels[requestedRole]} portal`}
            </p>
            <Button className="mt-10 w-full bg-white text-primary" onClick={() => setStep(2)}>
              Begin
            </Button>
          </section>
        )}

        {isWellnessUser && step === 2 && (
          <GlassCard>
            <h2 className="font-heading text-3xl text-primary">How are you feeling right now?</h2>
            <input
              type="range" min={1} max={10} value={moodScore}
              onChange={(event) => setMoodScore(Number(event.target.value))}
              className="mt-8 h-2 w-full accent-primary"
            />
            <div className="mt-3 flex justify-between text-xs uppercase tracking-[0.16em] text-foreground/55">
              <span>Heavy</span>
              <span>Light</span>
            </div>
            <Button className="mt-8 w-full" onClick={() => setStep(3)}>Continue</Button>
          </GlassCard>
        )}

        {isWellnessUser && step === 3 && (
          <GlassCard>
            <h2 className="font-heading text-3xl text-primary">What&apos;s on your mind?</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {concernsList.map((label) => (
                <button key={label} type="button" onClick={() => toggleConcern(label)}
                  className={`rounded-full border px-5 py-3 text-sm ${concerns.includes(label) ? "border-primary bg-primary text-white" : "border-surface-stroke bg-white text-foreground/70"}`}>
                  {label}
                </button>
              ))}
            </div>
            <Button className="mt-8 w-full" onClick={() => setStep(4)} disabled={concerns.length === 0}>
              Continue
            </Button>
          </GlassCard>
        )}

        {isWellnessUser && step === 4 && (
          <GlassCard>
            <h2 className="font-heading text-3xl text-primary">What do you need right now?</h2>
            <div className="mt-6 space-y-3">
              {needs.map((need) => (
                <button key={need.id} type="button" onClick={() => setPrimaryNeed(need.id)}
                  className={`w-full rounded-[24px] border px-5 py-4 text-left ${primaryNeed === need.id ? "border-primary bg-primary text-white" : "border-surface-stroke bg-white text-foreground"}`}>
                  {need.label}
                </button>
              ))}
            </div>
            <Button className="mt-8 w-full" onClick={() => setStep(5)} disabled={loading}>Continue</Button>
          </GlassCard>
        )}

        {isWellnessUser && step === 5 && (
          <GlassCard>
            <h2 className="font-heading text-3xl text-primary">Phone + OTP</h2>
            <p className="mt-2 text-sm text-foreground/65">No name required. 100% anonymous.</p>
            <input value={phone} onChange={(event) => setPhone(event.target.value)}
              placeholder="9876543210" className="mt-6 h-14 w-full rounded-full bg-surface-low px-5 outline-none" />
            <input value={otp} onChange={(event) => setOtp(event.target.value)}
              placeholder="Enter OTP" className="mt-4 h-14 w-full rounded-full bg-surface-low px-5 outline-none" />
            {debugOtp ? <p className="mt-3 text-xs text-foreground/60">Dev OTP: {debugOtp}</p> : null}
            {error ? <p className="mt-3 text-sm text-crisis">{error}</p> : null}
            <div className="mt-8 grid gap-3">
              <Button variant="ghost" className="w-full" onClick={requestOtp} disabled={loading || phone.length < 10}>
                Send OTP
              </Button>
              <Button className="w-full gap-2" onClick={verifyOtp} disabled={loading || otp.length < 4}>
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </GlassCard>
        )}

        {isWellnessUser && step === 6 && (
          <GlassCard className="text-center">
            <h2 className="font-heading text-3xl text-primary">Manas is here.</h2>
            <p className="mt-4 text-foreground/70">
              I&apos;m Manas, your AI wellness companion. First we&apos;ll complete your profile setup, then take you into your portal.
            </p>
          </GlassCard>
        )}
      </div>
    </main>
  );
}
