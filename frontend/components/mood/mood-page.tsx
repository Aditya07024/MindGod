"use client";

import { useEffect, useState } from "react";
import { Pen, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { apiFetch } from "@/lib/api/client";

type CalendarEntry = {
  date: string;
  score: number;
  tags: string[];
  note?: string;
};

type MoodInsights = {
  averageScore: number;
  insight: string;
};

export function MoodPage() {
  const [calendar, setCalendar] = useState<Record<string, CalendarEntry>>({});
  const [trends, setTrends] = useState<MoodInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<{ calendar: CalendarEntry[] }>("/mood/calendar"),
      apiFetch<MoodInsights>("/mood/insights")
    ])
      .then(([calendarData, trendsData]) => {
        setCalendar(Object.fromEntries(calendarData.calendar.map((entry) => [entry.date, entry])));
        setTrends(trendsData);
      })
      .catch((error) => {
        console.error("Error fetching mood data:", error);
      })
      .finally(() => setLoading(false));
  }, []);

  const getMoodColor = (score: number) => {
    if (score <= 2) return "bg-red-200";
    if (score <= 4) return "bg-coral/40";
    if (score <= 6) return "bg-gold/50";
    if (score <= 8) return "bg-primary/50";
    return "bg-primary/80";
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-4xl text-primary">Mood Sanctuary</h1>
          <p className="mt-2 text-foreground/70">Track your emotional rhythm</p>
        </div>
        <Button className="gap-2">
          <Pen className="h-4 w-4" />
          Log Today
        </Button>
      </div>

      {loading ? <GlassCard>Loading mood history...</GlassCard> : null}

      <div className="grid gap-6 lg:grid-cols-12">
        <GlassCard className="lg:col-span-8">
          <h2 className="mb-6 font-heading text-2xl text-primary">Emotional Calendar</h2>
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="mb-2 text-center text-xs font-semibold text-foreground/60">
                {day}
              </div>
            ))}
            {Array.from({ length: 35 }).map((_, idx) => {
              const date = new Date();
              date.setDate(date.getDate() - (34 - idx));
              const dateStr = date.toISOString().split("T")[0];
              const dayData = calendar[dateStr];
              const moodScore = dayData?.score || 0;

              return (
                <div
                  key={idx}
                  className={`aspect-square rounded-xl transition-colors ${
                    moodScore > 0 ? getMoodColor(moodScore) : "bg-surface-low"
                  }`}
                />
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-4">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-2xl text-primary">AI Insights</h2>
          </div>
          {trends ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-foreground/60">Average Mood</p>
                <p className="mt-2 font-heading text-3xl text-primary">{trends.averageScore.toFixed(1)}/10</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-foreground/60">AI Insight</p>
                <p className="mt-2 text-lg text-foreground/80">{trends.insight}</p>
              </div>
            </div>
          ) : null}
        </GlassCard>
      </div>
    </div>
  );
}
