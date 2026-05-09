import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import {
  Sparkles, MessageCircle, Heart, Wind, ShieldCheck,
  Users, Building2, Shield, ChevronRight,
} from 'lucide-react';
import { useEffect } from 'react';
import API from '@/lib/api';
import logoUrl from '@/assets/logo.png';

export const Route = createFileRoute('/')({
  component: Landing,
  head: () => ({
    meta: [
      { title: 'MindGod — Apna Dil Kholo' },
      { name: 'description', content: "India's warm, AI-powered mental wellness companion." },
    ],
  }),
});

const PORTALS = [
  {
    id: 'user',
    icon: MessageCircle,
    title: 'I need support',
    subtitle: 'Chat with Manas AI, track mood, book therapists',
    color: 'from-teal-500/10 to-teal-600/5 border-teal-200 hover:border-teal-400',
    iconBg: 'bg-teal-100 text-teal-700',
    dest: '/sign-in',
  },
  {
    id: 'therapist',
    icon: Users,
    title: 'I am a Therapist',
    subtitle: 'Manage sessions, view AI briefs, join WebRTC calls',
    color: 'from-blue-500/10 to-blue-600/5 border-blue-200 hover:border-blue-400',
    iconBg: 'bg-blue-100 text-blue-700',
    dest: '/sign-in',
  },
  {
    id: 'org_admin',
    icon: Building2,
    title: 'Organisation Admin',
    subtitle: 'Anonymous team wellness analytics, seat management',
    color: 'from-violet-500/10 to-violet-600/5 border-violet-200 hover:border-violet-400',
    iconBg: 'bg-violet-100 text-violet-700',
    dest: '/sign-in',
  },
  {
    id: 'super_admin',
    icon: Shield,
    title: 'Super Admin',
    subtitle: 'Ops dashboard, therapist verification, platform analytics',
    color: 'from-slate-500/10 to-slate-600/5 border-slate-200 hover:border-slate-400',
    iconBg: 'bg-slate-100 text-slate-700',
    dest: '/sign-in',
  },
] as const;

function Landing() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();

  // Auto-redirect signed-in users to their role's portal
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    API.auth.me()
      .then((me: any) => {
        const role = me?.role ?? 'user';
        if (role === 'therapist') navigate({ to: '/therapist/dashboard' });
        else if (role === 'org_admin') navigate({ to: '/org/dashboard' });
        else if (role === 'super_admin') navigate({ to: '/admin/dashboard' });
        else navigate({ to: '/dashboard' });
      })
      .catch(() => navigate({ to: '/dashboard' }));
  }, [isSignedIn, isLoaded, navigate]);

  return (
    <div className="min-h-screen bg-canvas-gradient">
      {/* Header */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <img src={logoUrl} alt="MindGod Logo" className="size-9 object-contain" />
          <span className="font-display text-xl font-bold text-primary-deep">MindGod</span>
        </div>
        <Link to="/sign-in"
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
          Sign In
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-20">
        {/* Hero */}
        <section className="grid gap-12 md:grid-cols-2 md:items-center pt-10">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
              className="font-display text-5xl font-bold leading-tight text-primary-deep md:text-6xl"
            >
              Apna Dil Kholo.
              <br />
              <span className="text-accent">Mann Halka Karo.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.7 }}
              className="mt-6 max-w-md text-lg text-muted-foreground"
            >
              India's warm, AI-powered mental wellness platform — for individuals, therapists, and organisations.
            </motion.p>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-primary" />
              Sign in with Google, Apple, or email — no passwords needed.
            </div>
          </div>

          {/* Breathing orb */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}
            className="relative aspect-square w-full max-w-sm justify-self-center"
          >
            <div className="absolute inset-0 rounded-full bg-warm-gradient opacity-20 blur-3xl" />
            <div className="relative flex h-full items-center justify-center">
              <div className="size-52 animate-breathe rounded-full bg-warm-gradient shadow-2xl shadow-primary/30 md:size-64" />
              <div className="absolute font-display text-2xl font-semibold text-primary-foreground">Breathe</div>
            </div>
          </motion.div>
        </section>

        {/* Portal Selector */}
        <section className="mt-20">
          <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-6">
            Choose your portal
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {PORTALS.map((p, i) => (
              <motion.div key={p.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
              >
                <Link to={p.dest}
                  onClick={() => localStorage.setItem('mindgod_intent_role', p.id)}
                  className={`group flex items-center gap-4 rounded-2xl border bg-gradient-to-br p-4 transition-all ${p.color}`}>
                  <div className={`grid size-12 flex-shrink-0 place-items-center rounded-xl ${p.iconBg}`}>
                    <p.icon className="size-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-primary-deep">{p.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{p.subtitle}</p>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground group-hover:text-primary transition flex-shrink-0" />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Role note */}
          <div className="mt-6 rounded-2xl bg-primary-soft/50 border border-primary/20 p-4 text-center">
            <p className="text-sm text-primary-deep">
              <strong>One sign-in for all portals.</strong> Your role (user, therapist, org admin, super admin)
              determines which dashboard you see after signing in.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Therapist & admin roles are assigned by the MindGod team. Contact us to get access.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            { icon: MessageCircle, t: 'Manas AI', d: 'A wise friend who listens, 24/7.' },
            { icon: Heart, t: 'Mood Diary', d: 'Notice your patterns. Spot the dips.' },
            { icon: Wind, t: 'Calm Tools', d: '5 breathing exercises, fully offline.' },
          ].map((f) => (
            <div key={f.t} className="rounded-3xl bg-card p-6 shadow-sm">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                <f.icon className="size-6" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-primary-deep">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
