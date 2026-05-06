"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { Wind } from "lucide-react";

export function BreathingPage() {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [secondsLeft, setSecondsLeft] = useState(4);
  const circleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const phaseConfig = {
      inhale: 4,
      hold: 4,
      exhale: 4
    };

    const duration = phaseConfig[phase];
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setPhase((p) => {
            if (p === "inhale") return "hold";
            if (p === "hold") return "exhale";
            return "inhale";
          });
          return phaseConfig[phase] || 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, phase]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-heading text-4xl text-primary">Breathing Room</h1>
        <p className="mt-2 text-foreground/70">4-minute mindful pause</p>
      </div>

      <GlassCard className="flex flex-col items-center justify-center py-20">
        <div
          ref={circleRef}
          className={`h-64 w-64 rounded-full border-4 border-primary/30 flex items-center justify-center transition-all duration-1000 ${
            phase === "inhale"
              ? "scale-100"
              : phase === "hold"
              ? "scale-100"
              : "scale-90"
          }`}
        >
          <div className="text-center">
            <p className="text-6xl font-bold text-primary">{secondsLeft}</p>
            <p className="mt-4 font-heading text-xl text-primary capitalize">{phase}</p>
          </div>
        </div>

        <div className="mt-12 text-center space-y-4">
          <Button
            size="lg"
            onClick={() => setIsActive(!isActive)}
            className="px-12"
          >
            {isActive ? "Pause" : "Start Session"}
          </Button>
          <p className="text-sm text-foreground/60">
            {isActive
              ? `${phase === "inhale" ? "Breathe in" : phase === "hold" ? "Hold" : "Breathe out"} for ${secondsLeft} seconds`
              : "Start a 4-minute breathing exercise"}
          </p>
        </div>
      </GlassCard>

      <div className="grid gap-6 md:grid-cols-3">
        {["4-7-8 Technique", "Box Breathing", "Grounding"].map((exercise) => (
          <GlassCard key={exercise}>
            <Wind className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-heading text-xl text-primary mb-2">{exercise}</h3>
            <p className="text-sm text-foreground/70 mb-4">
              {exercise === "4-7-8 Technique"
                ? "Natural rhythmic breathing for the nervous system"
                : exercise === "Box Breathing"
                ? "Technique for calm focus and mental clarity"
                : "Deep roots to keep yourself centered"}
            </p>
            <Button variant="outline" className="w-full">
              Learn More
            </Button>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
