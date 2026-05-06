import { CalendarDays, Circle, MessageCircleMore, Mic, Play, ShieldAlert, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";

export function DashboardView() {
  return (
    <div className="grid gap-6 md:grid-cols-12">
      <GlassCard className="md:col-span-8">
        <p className="text-lg text-foreground/65">Namaste, Rohan</p>
        <h1 className="mt-2 font-heading text-4xl text-primary">Your journey to peace continues today.</h1>
        <div className="mt-8">
          <div className="flex justify-between text-xs uppercase tracking-[0.18em] text-foreground/55">
            <span>Anxious</span>
            <span>Radiant</span>
          </div>
          <input type="range" defaultValue={4} min={1} max={5} className="mt-3 h-2 w-full accent-primary" />
        </div>
      </GlassCard>
      <GlassCard className="bg-primary text-white md:col-span-4">
        <Circle className="h-10 w-10 fill-gold text-gold" />
        <h2 className="mt-6 font-heading text-3xl">Breathe with us</h2>
        <p className="mt-3 text-white/80">A 2-minute box breathing session to center your mind.</p>
        <Button variant="ghost" className="mt-6 w-full bg-white text-primary">
          <Play className="mr-2 h-4 w-4" />
          Start session
        </Button>
      </GlassCard>
      <GlassCard className="md:col-span-5">
        <div className="flex items-center gap-3">
          <MessageCircleMore className="h-5 w-5 text-primary" />
          <p className="font-heading text-2xl text-primary">Manas AI preview</p>
        </div>
        <p className="mt-4 rounded-[24px] bg-white/80 p-4 text-foreground/75">
          You’ve been carrying a lot of pressure lately. Want to unpack the part that feels heaviest?
        </p>
      </GlassCard>
      <GlassCard className="md:col-span-4">
        <p className="font-heading text-2xl text-primary">CBT prompt</p>
        <p className="mt-4 text-foreground/70">What thought showed up most strongly when work stress peaked today?</p>
      </GlassCard>
      <GlassCard className="md:col-span-3">
        <p className="font-heading text-2xl text-crisis">Crisis support</p>
        <p className="mt-4 text-foreground/70">If you feel unsafe, move straight to urgent support.</p>
        <Button variant="crisis" className="mt-6 w-full">
          <ShieldAlert className="mr-2 h-4 w-4" />
          Get help now
        </Button>
      </GlassCard>
    </div>
  );
}

export function ChatView() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <GlassCard>
        <div className="space-y-6">
          <div className="max-w-2xl rounded-[28px] rounded-tl-md bg-white/70 p-5">
            Namaste. I&apos;m here with you. No pressure to be fine.
          </div>
          <div className="ml-auto max-w-2xl rounded-[28px] rounded-tr-md bg-primary p-5 text-white">
            I feel overwhelmed by work and like everyone is judging me.
          </div>
          <div className="max-w-2xl rounded-[28px] rounded-tl-md border border-coral/20 bg-coral/10 p-5">
            It sounds exhausting. Let&apos;s separate what happened from what your mind predicted.
          </div>
          <div className="rounded-[28px] border border-crisis/20 bg-red-50 p-5">
            <p className="font-heading text-xl text-crisis">Need more support?</p>
            <p className="mt-2 text-sm text-foreground/70">If you feel unsafe, we can move you to emergency support immediately.</p>
          </div>
        </div>
      </GlassCard>
      <GlassCard className="sticky bottom-6">
        <div className="flex items-center gap-4">
          <input className="h-14 flex-1 rounded-full bg-surface-low px-5 outline-none" placeholder="Tell Manas what is on your mind..." />
          <Button><Mic className="h-4 w-4" /></Button>
        </div>
      </GlassCard>
    </div>
  );
}

export function MoodView() {
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <GlassCard className="lg:col-span-8">
        <h1 className="font-heading text-4xl text-primary">Mood Sanctuary</h1>
        <p className="mt-3 text-foreground/70">Calendar and trend surfaces are ready for Recharts data wiring.</p>
        <div className="mt-8 grid grid-cols-7 gap-3">
          {Array.from({ length: 35 }).map((_, index) => (
            <div key={index} className={`aspect-square rounded-2xl ${index % 5 === 0 ? "bg-primary/80" : index % 3 === 0 ? "bg-gold/70" : "bg-primary/15"}`} />
          ))}
        </div>
      </GlassCard>
      <GlassCard className="lg:col-span-4">
        <p className="font-heading text-2xl text-primary">AI insight</p>
        <p className="mt-4 text-foreground/70">Your calmest evenings followed journaling on family stress and 4-minute breathing sessions.</p>
      </GlassCard>
    </div>
  );
}

export function JournalView() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <GlassCard>
        <p className="font-heading text-3xl text-primary">Thought record</p>
        <div className="mt-6 space-y-4">
          {["Situation", "Automatic thought", "Evidence for", "Balanced response"].map((label) => (
            <label key={label} className="block">
              <span className="mb-2 block text-sm font-medium text-foreground/70">{label}</span>
              <textarea className="min-h-28 w-full rounded-[24px] bg-surface-low p-4 outline-none" />
            </label>
          ))}
        </div>
      </GlassCard>
      <GlassCard>
        <p className="font-heading text-3xl text-primary">AI reflection</p>
        <p className="mt-4 text-foreground/70">I notice you’re equating one delayed deliverable with being judged as inadequate.</p>
      </GlassCard>
    </div>
  );
}

export function BreathingView() {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <GlassCard className="overflow-hidden bg-breathing-glow py-16">
        <div className="mx-auto h-72 w-72 animate-breathe rounded-full bg-primary/20 blur-sm" />
        <h1 className="mt-10 font-heading text-4xl text-primary">Inhale for 4. Hold for 4. Exhale for 4.</h1>
        <p className="mt-4 text-foreground/70">Timer, grounding prompts, and audio hooks are wired for expansion.</p>
      </GlassCard>
    </div>
  );
}

export function TherapistsView() {
  return (
    <div className="space-y-6">
      <GlassCard>
        <h1 className="font-heading text-4xl text-primary">Find your sanctuary.</h1>
        <p className="mt-4 text-foreground/70">Browse RCI-verified therapists and book a session.</p>
      </GlassCard>
    </div>
  );
}

export function VideoView({ sessionId }: { sessionId: string }) {
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <GlassCard className="min-h-[520px] lg:col-span-8">
        <div className="flex h-full items-center justify-center rounded-[28px] bg-primary/10">
          <Video className="h-16 w-16 text-primary" />
        </div>
      </GlassCard>
      <GlassCard className="lg:col-span-4">
        <p className="font-heading text-2xl text-primary">Session {sessionId}</p>
        <p className="mt-4 text-foreground/70">LiveKit-ready control surface with therapist note capture.</p>
        <div className="mt-6 flex gap-3">
          <Button><Mic className="h-4 w-4" /></Button>
          <Button variant="coral"><Video className="h-4 w-4" /></Button>
        </div>
      </GlassCard>
    </div>
  );
}

export function TherapistPortalView() {
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <GlassCard className="lg:col-span-4">
        <p className="text-sm uppercase tracking-[0.2em] text-coral">Monthly earnings</p>
        <h1 className="mt-3 font-heading text-4xl text-primary">₹84,200</h1>
      </GlassCard>
      <GlassCard className="lg:col-span-8">
        <p className="font-heading text-3xl text-primary">Today&apos;s sessions</p>
        <div className="mt-6 space-y-4">
          {["10:00 AM • Priya", "1:30 PM • Karan", "7:30 PM • Neha"].map((slot) => (
            <div key={slot} className="flex items-center justify-between rounded-[24px] bg-white/70 p-4">
              <span>{slot}</span>
              <CalendarDays className="h-4 w-4 text-primary" />
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

export function OrgAdminView() {
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <GlassCard className="lg:col-span-8">
        <h1 className="font-heading text-4xl text-primary">Wellness analytics</h1>
        <p className="mt-3 text-foreground/70">Heatmaps, team trends, and ESG summary surfaces are scaffolded for org data.</p>
        <div className="mt-8 grid grid-cols-8 gap-2">
          {Array.from({ length: 40 }).map((_, index) => (
            <div key={index} className={`aspect-square rounded-xl ${index % 7 === 0 ? "bg-primary" : index % 4 === 0 ? "bg-coral/60" : "bg-primary/15"}`} />
          ))}
        </div>
      </GlassCard>
      <GlassCard className="lg:col-span-4">
        <p className="font-heading text-2xl text-primary">ESG report</p>
        <p className="mt-4 text-foreground/70">Export-ready section for monthly wellness indicators and utilization summaries.</p>
      </GlassCard>
    </div>
  );
}
