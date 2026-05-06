"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, CalendarClock, FileText, Phone, Save, ShieldAlert, UserRound } from "lucide-react";
import { GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth-store";
import { apiFetch } from "@/lib/api/client";

const roleFieldSets = {
  user: ["Preferred language", "Age range", "City", "Emergency contact"],
  therapist: ["Full name", "RCI number", "Primary specialization", "Languages"],
  org_admin: ["Full name", "Company name", "Department", "Work email"],
  super_admin: ["Full name", "Operations role", "Team", "Work email"]
} as const;

export function SetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role } = useAuthStore();
  const storageKey = `mindgod_setup_${role}`;
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const nextPath =
    searchParams?.get("next") ??
    (role === "user" ? "/dashboard" : `/${role.replace("_", "-")}`);

  const fields = roleFieldSets[role];

  // Pre-fill from localStorage cache
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setForm(JSON.parse(stored));
      } catch {
        // ignore malformed data
      }
    }
  }, [storageKey]);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      await apiFetch("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify(form)
      });
      localStorage.setItem(storageKey, JSON.stringify(form));
      router.replace(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <GlassCard>
        <p className="text-sm uppercase tracking-[0.2em] text-coral">First-time setup</p>
        <h1 className="mt-3 font-heading text-4xl text-primary">
          Tell us the required details for your portal.
        </h1>
        <p className="mt-3 text-foreground/70">
          This step is role-specific and saves your details securely.
        </p>
      </GlassCard>
      <GlassCard>
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <label key={field} className="block">
              <span className="mb-2 block text-sm font-medium text-foreground/70">{field}</span>
              <input
                value={form[field] ?? ""}
                onChange={(e) =>
                  setForm((current) => ({ ...current, [field]: e.target.value }))
                }
                className="h-14 w-full rounded-[20px] bg-surface-low px-4 outline-none"
              />
            </label>
          ))}
        </div>
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
        <Button className="mt-6 gap-2" onClick={handleSubmit} disabled={loading}>
          <Save className="h-4 w-4" />
          {loading ? "Saving…" : "Save and continue"}
        </Button>
      </GlassCard>
    </div>
  );
}

export function NotificationsPage() {
  const { role } = useAuthStore();
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ notifications: typeof notifications }>("/user/notifications")
      .then((data) => setNotifications(data.notifications))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="font-heading text-4xl text-primary">Notifications</h1>
        </div>
        <p className="mt-2 text-sm text-foreground/60">Role: {role.replace("_", " ")}</p>
      </GlassCard>
      {loading ? (
        <div className="text-center py-12 text-foreground/50">Loading notifications…</div>
      ) : notifications.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Bell className="mx-auto h-12 w-12 text-primary/20" />
          <p className="mt-4 font-heading text-2xl text-primary">All caught up!</p>
          <p className="mt-2 text-foreground/60">No new notifications right now.</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => (
            <GlassCard key={n.id}>
              <div className="flex items-start gap-3">
                <div className={`mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                  n.type === "booking" ? "bg-primary" : n.type === "alert" ? "bg-coral" : "bg-gold"
                }`} />
                <div>
                  <p className="text-foreground/80">{n.message}</p>
                  <p className="mt-1 text-xs text-foreground/40">{new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProfilePage() {
  const { role, phoneMasked, tier } = useAuthStore();
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const fields = role === "therapist"
    ? ["Full name", "RCI number", "Primary specialization", "Languages", "Session fee (₹)", "Bio"]
    : ["Full name", "Preferred language", "Location", "Emergency contact"];

  useEffect(() => {
    apiFetch<{ user: Record<string, unknown> }>("/user/profile")
      .then((data) => {
        const u = data.user;
        if (role === "therapist") {
          const tp = u.therapistProfile as Record<string, unknown> | undefined;
          setForm({
            "Full name": String(tp?.name ?? ""),
            "RCI number": String(tp?.rciNumber ?? ""),
            "Primary specialization": Array.isArray(tp?.specializations) ? (tp.specializations as string[]).join(", ") : "",
            "Languages": Array.isArray(tp?.languages) ? (tp.languages as string[]).join(", ") : "",
            "Session fee (₹)": String(tp?.sessionFee ?? ""),
            "Bio": String(tp?.bio ?? "")
          });
        } else {
          setForm({
            "Full name": String(u.fullName ?? ""),
            "Preferred language": String(u.language ?? ""),
            "Location": String(u.location ?? ""),
            "Emergency contact": String(u.emergencyContact ?? "")
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [role]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await apiFetch("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify(form)
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <GlassCard className="lg:col-span-4">
        <UserRound className="h-12 w-12 text-primary" />
        <h1 className="mt-4 font-heading text-3xl text-primary">Profile</h1>
        <p className="mt-3 text-foreground/70">{phoneMasked || "No phone available"}</p>
        <p className="mt-2 text-sm uppercase tracking-[0.16em] text-coral">
          {role.replace("_", " ")} • {tier}
        </p>
      </GlassCard>
      <GlassCard className="lg:col-span-8">
        <h2 className="font-heading text-2xl text-primary">Account details</h2>
        {loading ? (
          <p className="mt-4 text-sm text-foreground/50">Loading profile…</p>
        ) : (
          <>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {fields.map((field) => (
                <label key={field} className={`block ${field === "Bio" ? "md:col-span-2" : ""}`}>
                  <span className="mb-2 block text-sm font-medium text-foreground/70">{field}</span>
                  {field === "Bio" ? (
                    <textarea
                      rows={3}
                      value={form[field] ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                      className="w-full rounded-[20px] bg-surface-low p-4 text-sm outline-none resize-none"
                    />
                  ) : (
                    <input
                      value={form[field] ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                      className="h-14 w-full rounded-[20px] bg-surface-low px-4 outline-none"
                    />
                  )}
                </label>
              ))}
            </div>
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
            {saved && <p className="mt-3 text-sm text-green-600 font-medium">✓ Profile saved!</p>}
            <Button className="mt-6 gap-2" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save profile"}
            </Button>
          </>
        )}
      </GlassCard>
    </div>
  );
}

export function CrisisSupportPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <GlassCard className="border border-crisis/20 bg-red-50">
        <div className="flex items-start gap-4">
          <ShieldAlert className="mt-1 h-8 w-8 text-crisis" />
          <div>
            <h1 className="font-heading text-4xl text-crisis">Crisis Support</h1>
            <p className="mt-3 text-foreground/80">
              If you feel unsafe right now, pause everything else and contact immediate support.
            </p>
          </div>
        </div>
      </GlassCard>
      <div className="grid gap-6 md:grid-cols-2">
        <GlassCard>
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-2xl text-primary">Helpline</h2>
          </div>
          <p className="mt-4 text-foreground/75">iCall: 9152987821</p>
          <Button className="mt-6">Call helpline</Button>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-2xl text-primary">Immediate grounding</h2>
          </div>
          <p className="mt-4 text-foreground/75">
            Start box breathing, contact a trusted person, and move to a safer space.
          </p>
          <Button className="mt-6">Start breathing</Button>
        </GlassCard>
      </div>
    </div>
  );
}

export function SessionRoomPage({ sessionId }: { sessionId: string }) {
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <GlassCard className="min-h-[560px] lg:col-span-8">
        <div className="flex h-full flex-col justify-between rounded-[28px] bg-primary/10 p-6">
          <div className="flex items-center justify-between">
            <p className="font-heading text-2xl text-primary">Session Room</p>
            <p className="rounded-full bg-white/80 px-4 py-2 text-sm text-primary">
              Session {sessionId}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex min-h-[220px] items-center justify-center rounded-[24px] bg-white/80 text-primary">
              Client video
            </div>
            <div className="flex min-h-[220px] items-center justify-center rounded-[24px] bg-white/80 text-primary">
              Therapist video
            </div>
          </div>
          <div className="flex gap-3">
            <Button>Mute mic</Button>
            <Button variant="coral">Toggle camera</Button>
            <Button variant="outline">Chat panel</Button>
          </div>
        </div>
      </GlassCard>
      <div className="space-y-6 lg:col-span-4">
        <GlassCard>
          <h2 className="font-heading text-2xl text-primary">Private therapist notes</h2>
          <textarea
            className="mt-4 min-h-40 w-full rounded-[20px] bg-surface-low p-4 outline-none"
            placeholder="Session notes..."
          />
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-2xl text-primary">AI Brief</h2>
          </div>
          <p className="mt-4 text-sm text-foreground/75">
            Risk: low today. Themes: work pressure, self-worth, family expectations.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
