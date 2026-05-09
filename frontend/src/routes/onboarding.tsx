import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Users, Heart, HeartPulse, Coins, UserMinus, MessageCircle, Wrench, Sparkles } from 'lucide-react';
import { useStore, type Concern, type NeedType } from '@/lib/store';
import { ManasAvatar } from '@/components/ManasAvatar';
import API from '@/lib/api';

export const Route = createFileRoute('/onboarding')({ component: Onboarding });

const CONCERNS: { id: Concern; label: string; icon: any }[] = [
  { id: 'work', label: 'Work Stress', icon: Briefcase },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'loneliness', label: 'Loneliness', icon: UserMinus },
  { id: 'health', label: 'Health', icon: HeartPulse },
  { id: 'relationships', label: 'Relationships', icon: Heart },
  { id: 'money', label: 'Money', icon: Coins },
];

const MOOD_EMOJIS = ['😞','😟','😕','😐','🙂','😊','😄','😁','🤩','🥰'];

function moodBg(score: number) {
  // cool teal to warm coral as score rises
  const t = (score - 1) / 9;
  const hueStart = 180; // teal
  const hueEnd = 35; // coral
  const hue = hueStart + (hueEnd - hueStart) * t;
  const light = 0.55 + 0.15 * t;
  return `oklch(${light} 0.10 ${hue})`;
}

function Onboarding() {
  const nav = useNavigate();
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [mood, setMood] = useState(5);
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [need, setNeed] = useState<NeedType | null>(null);
  const [streamed, setStreamed] = useState('');
  const [streaming, setStreaming] = useState(false);

  // Auto-redirect therapists and admins based on intent or existing role
  useEffect(() => {
    API.auth.me().then(async (me: any) => {
      let role = me?.role ?? 'user';
      
      const intendedRole = localStorage.getItem('mindgod_intent_role');
      if (intendedRole) {
        localStorage.removeItem('mindgod_intent_role');
      }

      if (role === 'therapist') nav({ to: '/therapist/dashboard', replace: true });
      else if (role === 'org_admin') nav({ to: '/org/dashboard', replace: true });
      else if (role === 'super_admin') nav({ to: '/admin/dashboard', replace: true });
    }).catch(() => {});
  }, [nav]);

  const next = () => setStep((s) => s + 1);

  const toggleConcern = (c: Concern) => {
    setConcerns((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));
  };

  const startFirstMessage = async (chosenNeed: NeedType) => {
    setNeed(chosenNeed);
    setStep(4);
    completeOnboarding({ firstName: firstName.trim() || 'friend', mood, concerns, need: chosenNeed });

    // wait for typing indicator
    await new Promise((r) => setTimeout(r, 1500));
    setStreaming(true);

    const concernText = concerns.length
      ? CONCERNS.filter((c) => concerns.includes(c.id)).map((c) => c.label.toLowerCase()).join(', ')
      : 'whatever is on your mind';
    const moodLabel = mood <= 3 ? 'pretty heavy' : mood <= 6 ? 'somewhere in the middle' : 'okay-ish';
    const needText =
      chosenNeed === 'talk'
        ? 'just wants someone to talk to'
        : chosenNeed === 'tools'
        ? 'is looking for tools and exercises'
        : 'just needs to express';

    const userMsg = `Hi Manas. I'm ${firstName || 'a new friend'}. I'm feeling ${moodLabel} (${mood}/10) and dealing with ${concernText}. I ${needText}. Please greet me warmly in 2-3 sentences and ask one gentle opening question.`;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: userMsg }] }),
      });
      if (!res.ok || !res.body) throw new Error('stream failed');
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      let acc = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf('\n')) !== -1) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6);
          if (json === '[DONE]') continue;
          try {
            const p = JSON.parse(json);
            const t = p?.choices?.[0]?.delta?.content;
            if (t) {
              acc += t;
              setStreamed(acc);
            }
          } catch {}
        }
      }
    } catch {
      setStreamed(
        `Hi ${firstName || 'friend'}. I'm so glad you're here. Whatever you're carrying right now — you don't have to carry it alone. Would you like to tell me what's been weighing on you the most?`
      );
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="s0" exit={{ opacity: 0 }} className="flex min-h-screen flex-col items-center justify-center bg-warm-gradient px-6 text-center text-primary-foreground">
            <div className="relative mb-12 size-48">
              <div className="absolute inset-0 animate-breathe rounded-full bg-white/20" />
              <div className="absolute inset-4 animate-breathe rounded-full bg-white/30" style={{ animationDelay: '0.4s' }} />
            </div>
            <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2 }} className="font-display text-5xl font-bold md:text-6xl">
              Apna Dil Kholo
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }} className="mt-4 text-lg text-primary-foreground/80">
              A safe space, just for you.
            </motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 0.8 }} className="mt-12 w-full max-w-xs space-y-3">
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="What should I call you?"
                className="w-full rounded-full border-0 bg-white/15 px-5 py-3 text-center text-primary-foreground placeholder:text-primary-foreground/60 backdrop-blur outline-none focus:bg-white/25"
              />
              <button onClick={next} className="w-full rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground transition hover:scale-[1.02]">
                Begin
              </button>
            </motion.div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="s1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="flex min-h-screen flex-col items-center justify-center px-6 text-center transition-colors duration-500"
            style={{ backgroundColor: moodBg(mood) }}
          >
            <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">How are you feeling right now?</h2>
            <div className="mt-12 text-8xl">{MOOD_EMOJIS[mood - 1]}</div>
            <div className="mt-8 w-full max-w-md">
              <input
                type="range"
                min={1}
                max={10}
                value={mood}
                onChange={(e) => setMood(Number(e.target.value))}
                className="w-full accent-white"
              />
              <div className="mt-2 flex justify-between text-sm text-primary-foreground/80">
                <span>Heavy</span>
                <span className="font-semibold">{mood}/10</span>
                <span>Light</span>
              </div>
            </div>
            <button onClick={next} className="mt-10 rounded-full bg-white px-8 py-3 font-semibold text-primary transition hover:scale-[1.02]">
              Continue
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex min-h-screen flex-col items-center justify-center bg-canvas-gradient px-6">
            <h2 className="font-display text-3xl font-bold text-primary-deep md:text-4xl">What's on your mind?</h2>
            <p className="mt-2 text-muted-foreground">Pick anything that fits. Or none.</p>
            <div className="mt-10 grid w-full max-w-md grid-cols-2 gap-3 sm:grid-cols-3">
              {CONCERNS.map((c) => {
                const active = concerns.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleConcern(c.id)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition ${
                      active
                        ? 'border-accent bg-accent text-accent-foreground shadow-md'
                        : 'border-border bg-card text-foreground hover:border-primary/40'
                    }`}
                  >
                    <c.icon className="size-6" />
                    <span className="text-sm font-medium">{c.label}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={next} className="mt-10 rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground transition hover:scale-[1.02]">
              Continue
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex min-h-screen flex-col items-center justify-center bg-canvas-gradient px-6">
            <h2 className="font-display text-3xl font-bold text-primary-deep md:text-4xl">What do you need today?</h2>
            <div className="mt-10 grid w-full max-w-2xl gap-4 sm:grid-cols-3">
              {[
                { id: 'talk', icon: MessageCircle, label: 'Someone to talk to' },
                { id: 'tools', icon: Wrench, label: 'Tools & exercises' },
                { id: 'express', icon: Sparkles, label: 'Just to express myself' },
              ].map((opt) => (
                <motion.button
                  key={opt.id}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => startFirstMessage(opt.id as NeedType)}
                  className="rounded-3xl bg-card p-6 text-left shadow-sm transition hover:shadow-lg"
                >
                  <div className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                    <opt.icon className="size-6" />
                  </div>
                  <div className="mt-4 font-display text-lg font-semibold text-primary-deep">{opt.label}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-screen flex-col items-center justify-center bg-canvas-gradient px-6 py-16">
            <div className="w-full max-w-lg">
              <div className="flex items-end gap-3">
                <ManasAvatar size={48} />
                <div className="rounded-3xl rounded-bl-md bg-card p-5 shadow-md">
                  {streamed ? (
                    <p className="whitespace-pre-wrap text-foreground">{streamed}</p>
                  ) : (
                    <div className="flex gap-1.5 py-2">
                      <span className="typing-dot inline-block size-2 rounded-full bg-primary/60" />
                      <span className="typing-dot inline-block size-2 rounded-full bg-primary/60" />
                      <span className="typing-dot inline-block size-2 rounded-full bg-primary/60" />
                    </div>
                  )}
                </div>
              </div>
              {!streaming && streamed && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => nav({ to: '/chat' })}
                  className="mt-8 w-full rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:scale-[1.01]"
                >
                  Continue talking with Manas
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
