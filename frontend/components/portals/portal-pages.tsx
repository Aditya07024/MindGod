"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, ArrowUpRight, BadgeIndianRupee, Brain, BriefcaseBusiness,
  Building2, CalendarClock, FileBarChart2, HeartPulse, LifeBuoy,
  Save, ShieldCheck, TrendingUp, Users, Wind
} from "lucide-react";
import { GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth-store";

/* ─── THERAPIST PORTAL ─── */

type TherapistTab = "overview" | "schedule" | "revenue" | "profile";

function RevenueBar({ data }: { data: { month: string; amount: number }[] }) {
  const max = Math.max(...data.map(d => d.amount), 1);
  return (
    <div className="flex items-end gap-4 h-36 mt-4">
      {data.map(d => (
        <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-xs font-medium text-primary">₹{(d.amount / 1000).toFixed(0)}k</span>
          <div className="w-full rounded-t-xl bg-primary/80 transition-all duration-700"
            style={{ height: `${(d.amount / max) * 110}px` }} />
          <span className="text-[10px] text-foreground/60">{d.month}</span>
        </div>
      ))}
    </div>
  );
}

interface TherapistStats {
  profile: { name: string; rciNumber: string; specializations: string[]; languages: string[]; sessionFee: number; rating: number; verified: boolean; bio: string; availability: { day: number; slots: string[] }[] };
  stats: { totalEarned: number; monthEarned: number; nextPayout: number; completedSessions: number; completedMonthSessions: number; totalBookings: number; monthBookings: number };
}
interface TherapistBookingRow { id: string; slot: string; status: string; topic: string; fee: number; paid: boolean; videoRoomId?: string; }

export function TherapistPortalPage() {
  const { phoneMasked } = useAuthStore();
  const [tab, setTab] = useState<TherapistTab>("overview");
  const [statsData, setStatsData] = useState<TherapistStats | null>(null);
  const [bookings, setBookings] = useState<TherapistBookingRow[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<Record<string, number>>({});
  const [loadingStats, setLoadingStats] = useState(true);
  const [profile, setProfile] = useState({ "Full name": "", "RCI number": "", "Primary specialization": "", "Languages": "", "Session fee (₹)": "", "Bio": "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [availSaving, setAvailSaving] = useState(false);

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const DEFAULT_SLOTS = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "17:00", "19:00", "20:00"];
  const [availability, setAvailability] = useState<Record<number, string[]>>({});

  useEffect(() => {
    Promise.all([
      apiFetch<TherapistStats>("/therapists/me/stats"),
      apiFetch<{ bookings: TherapistBookingRow[]; revenueByMonth: Record<string, number> }>("/therapists/me/bookings")
    ]).then(([stats, bData]) => {
      setStatsData(stats);
      setBookings(bData.bookings);
      setRevenueByMonth(bData.revenueByMonth);
      const p = stats.profile;
      setProfile({
        "Full name": p.name,
        "RCI number": p.rciNumber ?? "",
        "Primary specialization": p.specializations[0] ?? "",
        "Languages": p.languages.join(", "),
        "Session fee (₹)": String(p.sessionFee),
        "Bio": p.bio ?? ""
      });
      const avail: Record<number, string[]> = {};
      for (const a of p.availability) avail[a.day] = a.slots;
      setAvailability(avail);
    }).catch(() => {
      // Backend returns empty for new therapists — that's fine
    }).finally(() => setLoadingStats(false));
  }, []);

  const saveAvailability = async () => {
    setAvailSaving(true);
    const payload = Object.entries(availability).map(([day, slots]) => ({ day: Number(day), slots }));
    try { await apiFetch("/therapists/me/availability", { method: "PATCH", body: JSON.stringify({ availability: payload }) }); }
    catch { /* ignore */ } finally { setAvailSaving(false); }
  };

  const st = statsData?.stats;
  const upcoming = bookings.filter(b => b.status === "confirmed" && new Date(b.slot) >= new Date());
  const past = bookings.filter(b => b.status === "completed" || b.status === "cancelled");
  const revenueChartData = Object.entries(revenueByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-5)
    .map(([k, v]) => ({ month: k.slice(5), amount: v }));

  const toggleSlot = (day: number, slot: string) => {
    setAvailability(prev => {
      const current = prev[day] ?? [];
      const updated = current.includes(slot) ? current.filter(s => s !== slot) : [...current, slot];
      return { ...prev, [day]: updated };
    });
  };

  const handleSave = async () => {
    setSaving(true); setSaved(false); setSaveError("");
    try {
      await apiFetch("/auth/profile", { method: "PATCH", body: JSON.stringify(profile) });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed.");
    } finally { setSaving(false); }
  };

  const TABS: { id: TherapistTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "schedule", label: "Schedule" },
    { id: "revenue", label: "Revenue" },
    { id: "profile", label: "Profile" },
  ];

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`rounded-full px-6 py-2 text-sm font-medium transition ${tab === t.id ? "bg-primary text-white shadow" : "bg-white/70 text-foreground/70 hover:bg-white"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-12">
          <GlassCard className="lg:col-span-3">
            <p className="text-sm uppercase tracking-[0.2em] text-coral">Monthly Earnings</p>
            <h2 className="mt-2 font-heading text-4xl text-primary">{loadingStats ? "…" : `₹${(st?.monthEarned ?? 0).toLocaleString("en-IN")}`}</h2>
            <p className="mt-2 text-sm text-foreground/60">{st?.completedMonthSessions ?? 0} sessions this month</p>
          </GlassCard>
          <GlassCard className="lg:col-span-3">
            <p className="text-sm uppercase tracking-[0.2em] text-coral">Next Payout (85%)</p>
            <h2 className="mt-2 font-heading text-3xl text-primary">{loadingStats ? "…" : `₹${(st?.nextPayout ?? 0).toLocaleString("en-IN")}`}</h2>
            <p className="mt-2 text-sm text-foreground/60">Auto-transfer Friday</p>
          </GlassCard>
          <GlassCard className="lg:col-span-3">
            <p className="text-sm uppercase tracking-[0.2em] text-coral">Upcoming Sessions</p>
            <h2 className="mt-2 font-heading text-4xl text-primary">{loadingStats ? "…" : upcoming.length}</h2>
            <p className="mt-2 text-sm text-foreground/60">Confirmed bookings</p>
          </GlassCard>
          <GlassCard className="lg:col-span-3">
            <p className="text-sm uppercase tracking-[0.2em] text-coral">Session Fee</p>
            <h2 className="mt-2 font-heading text-3xl text-primary">₹{(statsData?.profile.sessionFee ?? 0).toLocaleString("en-IN")}</h2>
            {statsData?.profile.verified && <div className="mt-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary inline-block">RCI Verified ✓</div>}
          </GlassCard>

          {/* Today's sessions */}
          <GlassCard className="lg:col-span-8">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl text-primary">Today&apos;s Sessions</h2>
              <button onClick={() => setTab("schedule")} className="text-sm text-primary hover:underline">View all →</button>
            </div>
            <div className="mt-5 space-y-3">
              {upcoming.length === 0 && !loadingStats && <p className="text-sm text-foreground/50 py-4">No sessions today.</p>}
              {upcoming.slice(0, 3).map(s => {
                const d = new Date(s.slot);
                return (
                  <div key={String(s.id)} className="flex items-center justify-between rounded-[20px] bg-white/70 p-4">
                    <div className="flex items-center gap-4">
                      <CalendarClock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-primary">{d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} · Client</p>
                        <p className="text-sm text-foreground/60">{s.topic}</p>
                      </div>
                    </div>
                    {s.videoRoomId && <Link href={`/video/${s.videoRoomId}`}><Button className="gap-1.5 text-xs px-4 py-2 h-auto">Join</Button></Link>}
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* AI Brief */}
          <GlassCard className="lg:col-span-4">
            <div className="flex items-center gap-2">
              <LifeBuoy className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-xl text-primary">AI Brief · Priya</h2>
            </div>
            <div className="mt-4 space-y-2">
              {["7-day mood avg: 4.8/10", "Themes: work pressure, sleep", "Risk: low", "Last: self-worth reframing"].map(i => (
                <div key={i} className="rounded-[14px] bg-surface-low px-3 py-2 text-xs text-foreground/70">{i}</div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* ── SCHEDULE ── */}
      {tab === "schedule" && (
        <div className="space-y-6">
          {/* Upcoming appointments */}
          <GlassCard>
            <h2 className="font-heading text-2xl text-primary">Upcoming Appointments</h2>
            <p className="mt-1 text-sm text-foreground/60">All confirmed sessions in the next 7 days.</p>
            <div className="mt-5 space-y-3">
              {upcoming.length === 0 && !loadingStats && (
                <p className="py-6 text-center text-sm text-foreground/50">No upcoming appointments. Clients can book you via the therapist marketplace.</p>
              )}
              {upcoming.map(s => {
                const d = new Date(s.slot);
                return (
                  <div key={String(s.id)} className="flex items-center justify-between rounded-[20px] bg-white/70 p-4 flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 flex-col items-center justify-center rounded-[14px] bg-primary/10">
                        <CalendarClock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-primary">Client</p>
                        <p className="text-sm text-foreground/60">{s.topic}</p>
                        <p className="mt-0.5 text-xs text-foreground/50">{d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} at {d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-primary">₹{s.fee.toLocaleString("en-IN")}</span>
                      {s.videoRoomId && <Link href={`/video/${s.videoRoomId}`}><Button className="gap-1.5 text-xs px-4 h-9">Join Session</Button></Link>}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Availability manager */}
          <GlassCard>
            <h2 className="font-heading text-2xl text-primary">Manage Availability</h2>
            <p className="mt-1 text-sm text-foreground/60">Select the days and time slots you are available for bookings.</p>
            <div className="mt-5 space-y-5">
              {[1, 2, 3, 4, 5, 6, 0].map(day => (
                <div key={day}>
                  <p className="mb-2 text-sm font-semibold text-primary">{DAYS[day]}</p>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_SLOTS.map(slot => {
                      const active = (availability[day] ?? []).includes(slot);
                      return (
                        <button key={slot} onClick={() => toggleSlot(day, slot)}
                          className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${active ? "border-primary bg-primary text-white" : "border-surface-stroke bg-white text-foreground/60 hover:border-primary"}`}>
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <Button className="mt-6 gap-2" onClick={saveAvailability} disabled={availSaving}>
              <Save className="h-4 w-4" /> {availSaving ? "Saving…" : "Save Availability"}
            </Button>
          </GlassCard>
        </div>
      )}

      {/* ── REVENUE ── */}
      {tab === "revenue" && (
        <div className="grid gap-6 lg:grid-cols-12">
          <GlassCard className="lg:col-span-4">
            <p className="text-sm uppercase tracking-[0.2em] text-coral">Total Earned</p>
            <h2 className="mt-2 font-heading text-4xl text-primary">₹{(st?.totalEarned ?? 0).toLocaleString("en-IN")}</h2>
            <p className="mt-2 text-sm text-foreground/60">{st?.completedSessions ?? 0} completed sessions</p>
          </GlassCard>
          <GlassCard className="lg:col-span-4">
            <p className="text-sm uppercase tracking-[0.2em] text-coral">This Month</p>
            <h2 className="mt-2 font-heading text-4xl text-primary">₹{(st?.monthEarned ?? 0).toLocaleString("en-IN")}</h2>
            <p className="mt-2 text-sm text-foreground/60">{st?.completedMonthSessions ?? 0} sessions</p>
          </GlassCard>
          <GlassCard className="lg:col-span-4">
            <p className="text-sm uppercase tracking-[0.2em] text-coral">Next Payout (85%)</p>
            <h2 className="mt-2 font-heading text-4xl text-primary">₹{(st?.nextPayout ?? 0).toLocaleString("en-IN")}</h2>
            <p className="mt-2 text-sm text-foreground/60">Auto-transfer Friday</p>
          </GlassCard>

          {/* Revenue chart */}
          <GlassCard className="lg:col-span-8">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-2xl text-primary">Monthly Revenue</h2>
            </div>
            <RevenueBar data={revenueChartData.length ? revenueChartData : [{ month: "–", amount: 0 }]} />
          </GlassCard>

          {/* Payout info */}
          <GlassCard className="lg:col-span-4">
            <h2 className="font-heading text-xl text-primary">Payout Schedule</h2>
            <div className="mt-4 space-y-3">
              {[
                { label: "Frequency", value: "Weekly (Every Friday)" },
                { label: "Method", value: "Bank Transfer" },
                { label: "Platform fee", value: "15%" },
                { label: "Your cut", value: "85%" },
              ].map(item => (
                <div key={item.label} className="flex justify-between rounded-[14px] bg-surface-low px-4 py-3">
                  <span className="text-xs text-foreground/60">{item.label}</span>
                  <span className="text-xs font-semibold text-primary">{item.value}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Session history */}
          <GlassCard className="lg:col-span-12">
            <h2 className="font-heading text-2xl text-primary">Session History</h2>
            <div className="mt-5 space-y-3">
              {past.length === 0 && !loadingStats && <p className="py-4 text-sm text-foreground/50">No completed sessions yet.</p>}
              {past.map((s, i) => {
                const d = new Date(s.slot);
                return (
                  <div key={i} className="flex items-center justify-between rounded-[20px] bg-white/70 p-4 flex-wrap gap-2">
                    <div className="flex items-center gap-4">
                      <BadgeIndianRupee className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-primary">Client</p>
                        <p className="text-xs text-foreground/55">{d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${s.status === "completed" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                        {s.status}
                      </span>
                      <span className="text-sm font-medium text-primary">
                        {s.paid ? `₹${s.fee.toLocaleString("en-IN")}` : <span className="text-foreground/40">Not paid</span>}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      )}

      {/* ── PROFILE ── */}
      {tab === "profile" && (
        <div className="max-w-2xl space-y-6">
          <GlassCard>
            <div className="flex items-center gap-3">
              <BriefcaseBusiness className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-2xl text-primary">Therapist Profile</h2>
            </div>
            <p className="mt-1 text-xs text-foreground/50">{phoneMasked || "Signed in"}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {(Object.keys(profile) as Array<keyof typeof profile>).map(field => (
                <label key={field} className={`block ${field === "Bio" ? "md:col-span-2" : ""}`}>
                  <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-foreground/60">{field}</span>
                  {field === "Bio" ? (
                    <textarea rows={3} value={profile[field]}
                      onChange={e => setProfile(p => ({ ...p, [field]: e.target.value }))}
                      className="w-full rounded-[16px] bg-surface-low p-3 text-sm outline-none resize-none" />
                  ) : (
                    <input value={profile[field]}
                      onChange={e => setProfile(p => ({ ...p, [field]: e.target.value }))}
                      className="h-12 w-full rounded-[16px] bg-surface-low px-4 text-sm outline-none" />
                  )}
                </label>
              ))}
            </div>
            {saveError && <p className="mt-3 text-sm text-red-500">{saveError}</p>}
            {saved && <p className="mt-3 text-sm text-green-600 font-medium">✓ Profile saved!</p>}
            <Button className="mt-5 gap-2 w-full" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save Therapist Profile"}
            </Button>
          </GlassCard>
        </div>
      )}
    </div>
  );
}



/* ─── ORG ANALYTICS ─── */

interface OrgStats {
  totalUsers: number;
  activeUsers: number;
  avgMood: string;
  engagement: string;
  chatSessions: number;
  seatsUsed: string;
}

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="mt-4 flex items-end gap-3 h-40">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-xs font-medium text-primary">{d.value}</span>
          <div className="w-full rounded-t-xl bg-primary/80 transition-all duration-700"
            style={{ height: `${(d.value / max) * 120}px` }} />
          <span className="text-[10px] text-foreground/60 text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function OrgAdminPortalPage() {
  const [tab, setTab] = useState<"analytics" | "userview">("analytics");
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<OrgStats>("/admin/org-stats")
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const downloadReport = () => {
    const rows = [
      "MindGod ESG Wellness Report",
      `Avg mood: ${stats?.avgMood ?? "N/A"}`,
      `Active users: ${stats?.activeUsers ?? 0}`,
      `Engagement: ${stats?.engagement ?? "N/A"}`,
      `Chat sessions (30d): ${stats?.chatSessions ?? 0}`,
      `Seats: ${stats?.seatsUsed ?? "N/A"}`
    ].join("\n");
    const blob = new Blob([rows], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "mindgod-esg-wellness-report.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(["analytics", "userview"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-6 py-2 text-sm font-medium transition ${tab === t ? "bg-primary text-white shadow" : "bg-white/70 text-foreground/70 hover:bg-white"}`}>
            {t === "analytics" ? "Org Analytics" : "User View"}
          </button>
        ))}
      </div>

      {tab === "analytics" && (
        <div className="grid gap-6 lg:grid-cols-12">
          <GlassCard className="lg:col-span-8">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              <h1 className="font-heading text-4xl text-primary">Org Wellness Analytics</h1>
            </div>
            <p className="mt-2 text-foreground/70">Anonymous, aggregate-only insights from your database.</p>
            {loading ? (
              <p className="mt-6 text-sm text-foreground/50">Loading analytics…</p>
            ) : (
              <BarChart data={[
                { label: "Active Users", value: stats?.activeUsers ?? 0 },
                { label: "Chat Sessions", value: stats?.chatSessions ?? 0 },
                { label: "Total Users", value: stats?.totalUsers ?? 0 },
              ]} />
            )}
          </GlassCard>

          <GlassCard className="lg:col-span-4">
            <h2 className="font-heading text-2xl text-primary">Snapshot</h2>
            <div className="mt-4 space-y-3">
              {[
                { label: "Avg team mood", value: stats?.avgMood ?? "…" },
                { label: "Active users", value: loading ? "…" : String(stats?.activeUsers ?? 0) },
                { label: "Engagement", value: stats?.engagement ?? "…" },
                { label: "Seats used", value: stats?.seatsUsed ?? "…" }
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-[20px] bg-surface-low p-4">
                  <span className="text-sm text-foreground/70">{item.label}</span>
                  <span className="font-heading text-lg text-primary">{item.value}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="lg:col-span-12">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-2xl text-primary">ESG Wellness Report</h2>
                <p className="mt-1 text-foreground/70">Board-ready monthly usage and wellbeing metrics.</p>
              </div>
              <Button onClick={downloadReport}>Download Report</Button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                { label: "Avg mood", value: stats?.avgMood ?? "…", Icon: TrendingUp },
                { label: "Engagement", value: stats?.engagement ?? "…", Icon: FileBarChart2 },
                { label: "Chat sessions", value: loading ? "…" : String(stats?.chatSessions ?? 0), Icon: HeartPulse }
              ].map(({ label, value, Icon }) => (
                <div key={label} className="rounded-[20px] border border-surface-stroke bg-white/80 p-5">
                  <Icon className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-sm text-foreground/70">{label}</p>
                  <p className="mt-1 font-heading text-lg text-primary">{value}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {tab === "userview" && (
        <div className="grid gap-6 lg:grid-cols-12">
          <GlassCard className="lg:col-span-12">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <h1 className="font-heading text-4xl text-primary">User View</h1>
            </div>
            <p className="mt-2 text-foreground/70">Member-facing experience — for support, QA, and empathy checks.</p>
          </GlassCard>
          <GlassCard className="lg:col-span-6">
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-2xl text-primary">Manas AI Chat</h2>
            </div>
            <p className="mt-3 text-foreground/70">Empathetic AI wellness companion available 24/7. Supports Hindi &amp; English.</p>
            <Link href="/chat"><Button className="mt-4 w-full">Open Chat</Button></Link>
          </GlassCard>
          <GlassCard className="lg:col-span-6">
            <div className="flex items-center gap-3">
              <Wind className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-2xl text-primary">Breathing Exercise</h2>
            </div>
            <p className="mt-3 text-foreground/70">Box breathing, 4-7-8, and guided pranayama sessions.</p>
            <Link href="/breathing"><Button variant="outline" className="mt-4 w-full">Start Breathing</Button></Link>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

/* ─── SUPER ADMIN ─── */

interface PlatformStats {
  users: number;
  therapists: number;
  totalBookings: number;
  gmv: number;
  pendingTherapists: { id: string; name: string; rciNumber: string; verified: boolean }[];
}

export function SuperAdminPortalPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<PlatformStats>("/admin/stats")
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <GlassCard className="lg:col-span-3">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h1 className="mt-4 font-heading text-3xl text-primary">Platform ops</h1>
        <p className="mt-3 text-foreground/70">Cross-portal visibility for compliance, therapists, and operational health.</p>
      </GlassCard>
      <GlassCard className="lg:col-span-3">
        <Users className="h-6 w-6 text-primary" />
        <p className="mt-4 text-sm uppercase tracking-[0.2em] text-coral">Users</p>
        <h2 className="mt-2 font-heading text-4xl text-primary">{loading ? "…" : (stats?.users ?? 0).toLocaleString("en-IN")}</h2>
      </GlassCard>
      <GlassCard className="lg:col-span-3">
        <BriefcaseBusiness className="h-6 w-6 text-primary" />
        <p className="mt-4 text-sm uppercase tracking-[0.2em] text-coral">Therapists</p>
        <h2 className="mt-2 font-heading text-4xl text-primary">{loading ? "…" : (stats?.therapists ?? 0)}</h2>
      </GlassCard>
      <GlassCard className="lg:col-span-3">
        <BadgeIndianRupee className="h-6 w-6 text-primary" />
        <p className="mt-4 text-sm uppercase tracking-[0.2em] text-coral">GMV</p>
        <h2 className="mt-2 font-heading text-4xl text-primary">{loading ? "…" : `₹${(stats?.gmv ?? 0).toLocaleString("en-IN")}`}</h2>
      </GlassCard>
      <GlassCard className="lg:col-span-7">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-2xl text-primary">Pending therapist verification</h2>
            <p className="mt-2 text-foreground/70">Review new therapist applications and credential checks.</p>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {loading && <p className="text-sm text-foreground/50">Loading…</p>}
          {!loading && (stats?.pendingTherapists ?? []).length === 0 && (
            <p className="text-sm text-foreground/50 py-4">No pending verifications.</p>
          )}
          {(stats?.pendingTherapists ?? []).map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-[20px] bg-surface-low p-4">
              <span className="text-sm text-foreground/80">{t.name} • RCI: {t.rciNumber || "Not provided"}</span>
              <ArrowUpRight className="h-4 w-4 text-primary" />
            </div>
          ))}
        </div>
      </GlassCard>
      <GlassCard className="lg:col-span-5">
        <h2 className="font-heading text-2xl text-primary">Platform summary</h2>
        <div className="mt-5 space-y-3">
          {[
            { label: "Total bookings", value: loading ? "…" : String(stats?.totalBookings ?? 0) },
            { label: "Users", value: loading ? "…" : String(stats?.users ?? 0) },
            { label: "Therapists", value: loading ? "…" : String(stats?.therapists ?? 0) },
            { label: "GMV", value: loading ? "…" : `₹${(stats?.gmv ?? 0).toLocaleString("en-IN")}` }
          ].map((item) => (
            <div key={item.label} className="rounded-[20px] bg-surface-low p-4 text-sm text-foreground/75 flex justify-between">
              <span>{item.label}</span>
              <span className="font-heading text-primary">{item.value}</span>
            </div>
          ))}
        </div>
      </GlassCard>
      <GlassCard className="lg:col-span-12">
        <h2 className="font-heading text-2xl text-primary">Quick Portal Access</h2>
        <p className="mt-2 text-foreground/70">Navigate to any portal view without switching accounts.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/org-analytics"><Button variant="outline">Org Analytics</Button></Link>
          <Link href="/therapist-portal"><Button variant="outline">Therapist Portal</Button></Link>
          <Link href="/dashboard"><Button variant="outline">User View</Button></Link>
        </div>
      </GlassCard>
    </div>
  );
}

