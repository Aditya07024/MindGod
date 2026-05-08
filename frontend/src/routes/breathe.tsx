import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Wind, Square, Hand, User, Zap } from 'lucide-react';

export const Route = createFileRoute('/breathe')({ component: BreathePage });

type Phase = { label: string; seconds: number };
type Exercise = {
  id: string;
  title: string;
  desc: string;
  icon: any;
  phases: Phase[];
  cycles: number;
  emergency?: boolean;
};

const EXERCISES: Exercise[] = [
  {
    id: '478', title: '4-7-8 Breath', desc: 'Calms a racing mind. Best before sleep.', icon: Wind,
    phases: [{ label: 'Inhale', seconds: 4 }, { label: 'Hold', seconds: 7 }, { label: 'Exhale', seconds: 8 }],
    cycles: 4,
  },
  {
    id: 'box', title: 'Box Breathing', desc: 'Used by Navy SEALs. Resets your nervous system.', icon: Square,
    phases: [{ label: 'Inhale', seconds: 4 }, { label: 'Hold', seconds: 4 }, { label: 'Exhale', seconds: 4 }, { label: 'Hold', seconds: 4 }],
    cycles: 5,
  },
  {
    id: 'grounding', title: '5-4-3-2-1 Grounding', desc: 'Pull yourself back to the present.', icon: Hand,
    phases: [{ label: 'Notice 5 things you SEE', seconds: 15 }, { label: 'Notice 4 things you can TOUCH', seconds: 12 }, { label: 'Notice 3 things you HEAR', seconds: 10 }, { label: 'Notice 2 things you SMELL', seconds: 8 }, { label: 'Notice 1 thing you TASTE', seconds: 5 }],
    cycles: 1,
  },
  {
    id: 'scan', title: 'Body Scan', desc: 'Release tension you didn\'t know you held.', icon: User,
    phases: [{ label: 'Soften your forehead', seconds: 8 }, { label: 'Relax your jaw', seconds: 8 }, { label: 'Drop your shoulders', seconds: 8 }, { label: 'Unclench your hands', seconds: 8 }, { label: 'Feel your feet', seconds: 8 }],
    cycles: 1,
  },
  {
    id: 'emergency', title: 'Emergency Calm', desc: '3 cycles. For when you need it now.', icon: Zap, emergency: true,
    phases: [{ label: 'Inhale slowly', seconds: 4 }, { label: 'Hold', seconds: 2 }, { label: 'Long exhale', seconds: 6 }],
    cycles: 3,
  },
];

function BreathePage() {
  const [active, setActive] = useState<Exercise | null>(null);

  if (active) return <Player ex={active} onExit={() => setActive(null)} />;

  return (
    <AppShell>
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary-deep">Breathe</h1>
          <p className="mt-1 text-muted-foreground">Five guided exercises. Fully offline.</p>
        </div>
        <div className="space-y-3">
          {EXERCISES.map((e) => (
            <motion.button
              key={e.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActive(e)}
              className={`flex w-full items-center gap-4 rounded-3xl p-5 text-left shadow-sm transition hover:shadow-md ${
                e.emergency ? 'bg-crisis/10 ring-1 ring-crisis/30' : 'bg-card'
              }`}
            >
              <div className={`grid size-12 shrink-0 place-items-center rounded-2xl ${e.emergency ? 'bg-crisis text-crisis-foreground' : 'bg-primary-soft text-primary'}`}>
                <e.icon className="size-6" />
              </div>
              <div className="flex-1">
                <div className="font-display font-semibold">{e.title}</div>
                <div className="text-sm text-muted-foreground">{e.desc}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function Player({ ex, onExit }: { ex: Exercise; onExit: () => void }) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycle, setCycle] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(ex.phases[0].seconds);
  const [done, setDone] = useState(false);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    if (done) return;
    tickRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s > 1) return s - 1;
        // advance
        setPhaseIdx((pi) => {
          if (pi < ex.phases.length - 1) {
            setSecondsLeft(ex.phases[pi + 1].seconds);
            return pi + 1;
          }
          // next cycle
          setCycle((c) => {
            if (c < ex.cycles) {
              setSecondsLeft(ex.phases[0].seconds);
              return c + 1;
            }
            setDone(true);
            return c;
          });
          return 0;
        });
        return 0;
      });
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [done]);

  const phase = ex.phases[phaseIdx];
  const isInhale = phase.label.toLowerCase().includes('inhale') || phase.label.toLowerCase().includes('notice');
  const isExhale = phase.label.toLowerCase().includes('exhale') || phase.label.toLowerCase().includes('relax') || phase.label.toLowerCase().includes('soften') || phase.label.toLowerCase().includes('drop') || phase.label.toLowerCase().includes('unclench');
  const scale = isInhale ? 1.4 : isExhale ? 0.7 : 1;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-warm-gradient text-primary-foreground">
      <button onClick={onExit} className="m-4 inline-flex items-center gap-1 self-start rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur">
        <ChevronLeft className="size-4" /> End
      </button>
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        {!done ? (
          <>
            <div className="text-sm font-medium uppercase tracking-widest text-primary-foreground/70">
              {ex.title} · Cycle {cycle}/{ex.cycles}
            </div>
            <div className="relative my-10 flex size-72 items-center justify-center">
              <motion.div
                className="absolute inset-0 rounded-full bg-white/20"
                animate={{ scale }}
                transition={{ duration: phase.seconds, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute inset-6 rounded-full bg-white/30"
                animate={{ scale }}
                transition={{ duration: phase.seconds, ease: 'easeInOut' }}
              />
              <div className="relative z-10 text-7xl font-bold tabular-nums">{secondsLeft}</div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={phaseIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="font-display text-3xl font-semibold"
              >
                {phase.label}
              </motion.div>
            </AnimatePresence>
          </>
        ) : (
          <div className="text-center">
            <div className="font-display text-4xl font-bold">Well done.</div>
            <p className="mt-3 text-primary-foreground/80">Notice how your body feels right now.</p>
            <button onClick={onExit} className="mt-8 rounded-full bg-white px-6 py-3 font-semibold text-primary">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
