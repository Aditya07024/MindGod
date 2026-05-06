"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Brain, Calendar, CalendarCheck, HeartPulse, LineChart,
  MessageCircleMore, Play, ShieldAlert, Sparkles, Wind
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth-store";

interface UserStats {
  streak: number;
  moodAvg: string;
  chatCount: number;
  bookingsCount: number;
  latestMood: number | null;
}

export function DashboardView() {
  const { phoneMasked } = useAuthStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<UserStats>("/user/stats")
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="grid gap-6 md:grid-cols-12">
      {/* Welcome + mood */}
      <GlassCard className="md:col-span-8">
        <p className="text-lg text-foreground/65">Namaste 🙏</p>
        <h1 className="mt-2 font-heading text-4xl text-primary">
          Your journey to peace continues today.
        </h1>
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-[20px] bg-surface-low p-4 text-center">
            <p className="text-sm text-foreground/60">Streak</p>
            <p className="mt-1 font-heading text-2xl text-primary">{loading ? "…" : `${stats?.streak ?? 0} days`}</p>
          </div>
          <div className="rounded-[20px] bg-surface-low p-4 text-center">
            <p className="text-sm text-foreground/60">Avg Mood</p>
            <p className="mt-1 font-heading text-2xl text-primary">{loading ? "…" : (stats?.moodAvg ?? "–")}</p>
          </div>
          <div className="rounded-[20px] bg-surface-low p-4 text-center">
            <p className="text-sm text-foreground/60">Bookings</p>
            <p className="mt-1 font-heading text-2xl text-primary">{loading ? "…" : (stats?.bookingsCount ?? 0)}</p>
          </div>
        </div>
      </GlassCard>

      {/* Breathing */}
      <GlassCard className="bg-primary text-white md:col-span-4">
        <Wind className="h-8 w-8 text-white/80" />
        <h2 className="mt-4 font-heading text-3xl">Breathe with us</h2>
        <p className="mt-3 text-white/80">A 2-minute box breathing session to center your mind.</p>
        <Link href="/breathing">
          <Button variant="ghost" className="mt-6 w-full bg-white text-primary hover:bg-white/90">
            <Play className="mr-2 h-4 w-4" />
            Start session
          </Button>
        </Link>
      </GlassCard>

      {/* Manas AI Chat */}
      <GlassCard className="md:col-span-4">
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-primary" />
          <p className="font-heading text-2xl text-primary">Talk to Manas</p>
        </div>
        <p className="mt-4 text-foreground/70">Your empathetic AI wellness companion. Always here, 24/7.</p>
        <Link href="/chat">
          <Button className="mt-5 w-full gap-2">
            <MessageCircleMore className="h-4 w-4" />
            Open Chat
          </Button>
        </Link>
      </GlassCard>

      {/* Book Therapist */}
      <GlassCard className="md:col-span-4">
        <div className="flex items-center gap-3">
          <CalendarCheck className="h-5 w-5 text-primary" />
          <p className="font-heading text-2xl text-primary">Book Therapist</p>
        </div>
        <p className="mt-4 text-foreground/70">Find an RCI-verified therapist and schedule a confidential video session.</p>
        <Link href="/therapists">
          <Button className="mt-5 w-full gap-2">
            <Calendar className="h-4 w-4" />
            Browse Therapists
          </Button>
        </Link>
      </GlassCard>

      {/* Mood Tracker */}
      <GlassCard className="md:col-span-4">
        <div className="flex items-center gap-3">
          <LineChart className="h-5 w-5 text-primary" />
          <p className="font-heading text-2xl text-primary">Mood Insights</p>
        </div>
        <p className="mt-4 text-foreground/70">Track your emotional patterns and see AI-powered insights over time.</p>
        <Link href="/mood">
          <Button variant="outline" className="mt-5 w-full gap-2">
            <HeartPulse className="h-4 w-4" />
            View Mood
          </Button>
        </Link>
      </GlassCard>

      {/* CBT Journal */}
      <GlassCard className="md:col-span-6">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <p className="font-heading text-2xl text-primary">CBT Journal</p>
        </div>
        <p className="mt-4 text-foreground/70">
          Cognitive behavioural thought records — reframe negative patterns with guided prompts.
        </p>
        <Link href="/journal">
          <Button variant="outline" className="mt-5 w-full">Write an entry</Button>
        </Link>
      </GlassCard>

      {/* Crisis Support */}
      <GlassCard className="md:col-span-6 border-crisis/20">
        <p className="font-heading text-2xl text-crisis">Crisis support</p>
        <p className="mt-4 text-foreground/70">If you feel unsafe, reach out for immediate help. You are not alone.</p>
        <Link href="/crisis">
          <Button variant="crisis" className="mt-5 w-full gap-2">
            <ShieldAlert className="h-4 w-4" />
            Get help now
          </Button>
        </Link>
      </GlassCard>
    </div>
  );
}
