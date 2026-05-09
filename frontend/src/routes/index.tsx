import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import {
  Sparkles,
  MessageCircle,
  Heart,
  Wind,
  ShieldCheck,
  Users,
  Building2,
  Shield,
  ChevronRight,
  Play,
  Brain,
  Activity,
  Star,
  Globe2,
  ArrowRight,
  Instagram,
  Twitter,
  Linkedin,
} from "lucide-react";
import { useState, useEffect } from "react";
import API from "@/lib/api";
import logoUrl from "@/assets/logo.png";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "MindGod — Apna Dil Kholo" },
      { name: "description", content: "India's warm, AI-powered mental wellness companion." },
    ],
  }),
});

const PORTALS = [
  {
    id: "user",
    icon: MessageCircle,
    title: "I need support",
    subtitle: "Chat with Manas AI, track mood, book therapists",
    color: "from-teal-500/10 to-teal-600/5 border-teal-200 hover:border-teal-400",
    iconBg: "bg-teal-100 text-teal-700",
    dest: "/sign-in",
  },
  {
    id: "therapist",
    icon: Users,
    title: "I am a Therapist",
    subtitle: "Manage sessions, view AI briefs, join WebRTC calls",
    color: "from-blue-500/10 to-blue-600/5 border-blue-200 hover:border-blue-400",
    iconBg: "bg-blue-100 text-blue-700",
    dest: "/sign-in",
  },
  {
    id: "org_admin",
    icon: Building2,
    title: "Organisation Admin",
    subtitle: "Anonymous team wellness analytics, seat management",
    color: "from-violet-500/10 to-violet-600/5 border-violet-200 hover:border-violet-400",
    iconBg: "bg-violet-100 text-violet-700",
    dest: "/sign-in",
  },
  {
    id: "super_admin",
    icon: Shield,
    title: "Super Admin",
    subtitle: "Ops dashboard, therapist verification, platform analytics",
    color: "from-slate-500/10 to-slate-600/5 border-slate-200 hover:border-slate-400",
    iconBg: "bg-slate-100 text-slate-700",
    dest: "/sign-in",
  },
] as const;

function Landing() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");

  // Auto-redirect signed-in users to their role's portal
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    API.auth
      .me()
      .then((me: any) => {
        const role = me?.role ?? "user";
        if (role === "therapist") navigate({ to: "/therapist/dashboard" });
        else if (role === "org_admin") navigate({ to: "/org/dashboard" });
        else if (role === "super_admin") navigate({ to: "/admin/dashboard" });
        else navigate({ to: "/dashboard" });
      })
      .catch(() => navigate({ to: "/dashboard" }));
  }, [isSignedIn, isLoaded, navigate]);

  const handlePortalClick = (e: React.MouseEvent, portalId: string, dest: string) => {
    e.preventDefault();
    if (portalId === "super_admin") {
      setAdminModalOpen(true);
    } else {
      localStorage.setItem("mindgod_intent_role", portalId);
      navigate({ to: dest });
    }
  };

  const verifyAdminPassword = async () => {
    setIsVerifying(true);
    setError("");
    try {
      const r = await fetch(`${API_BASE}/api/admin/verify-password-public`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      });
      if (!r.ok) throw new Error("Invalid password");

      localStorage.setItem("mindgod_intent_role", "super_admin");
      navigate({ to: "/sign-in" });
    } catch (err: any) {
      setError(err.message);
      setAdminPassword("");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7fafc] relative text-slate-900">
      {/* Header */}
      <header className="sticky top-4 z-50 mx-auto mt-4 flex w-[95%] max-w-7xl items-center justify-between rounded-2xl border border-white/30 bg-white/70 px-5 py-3 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 shadow-lg shadow-cyan-500/20 overflow-hidden">
            <img src={logoUrl} alt="MindGod Logo" className="size-full object-cover" />
          </div>

          <div>
            <p className="font-display text-lg font-bold text-slate-900">MindGod</p>
            <p className="text-xs text-slate-500">AI Mental Wellness Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="#about"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 md:block"
          >
            About
          </a>

          <a
            href="#portals-section"
            className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.03] hover:bg-slate-800"
          >
            Get Started
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-24 pt-10 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="relative grid min-h-[82vh] items-center gap-16 lg:grid-cols-2">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-4 py-2 text-sm font-medium text-teal-700 shadow-sm"
            >
              <Sparkles className="size-4" />
              India’s AI Wellness Companion
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8 }}
              className="mt-7 font-display text-5xl font-bold leading-[1.02] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl"
            >
              Healing Starts
              <br />
              With Honest
              <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                {" "}
                Conversations
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="mt-7 max-w-xl text-lg leading-relaxed text-slate-600"
            >
              MindGod combines AI companionship, emotional wellness tools, therapist support, and
              mental health insights into one calming digital experience.
            </motion.p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#portals-section"
                className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-xl transition hover:scale-[1.03] hover:bg-slate-800"
              >
                Start Your Journey
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-teal-500" />
                Secure & Private
              </div>

              <div className="flex items-center gap-2">
                <Heart className="size-4 text-rose-500" />
                Emotion-Aware AI
              </div>

              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-amber-500" />
                Therapist Integrated
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative flex items-center justify-center"
          >
            <div className="absolute inset-0 rounded-[40px] bg-gradient-to-br from-cyan-200/40 to-teal-200/20 blur-3xl" />

            <div className="relative w-full max-w-xl rounded-[36px] border border-white/40 bg-white/70 p-6 shadow-2xl backdrop-blur-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Manas AI Session</p>
                  <p className="text-xs text-slate-500">Emotion-aware conversation</p>
                </div>

                <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Active
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="max-w-[85%] rounded-3xl rounded-bl-md bg-slate-100 px-4 py-3 text-sm text-slate-700">
                  I noticed your stress levels were higher this week. Want to talk about it?
                </div>

                <div className="ml-auto max-w-[80%] rounded-3xl rounded-br-md bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-3 text-sm text-white shadow-lg">
                  I’ve been overwhelmed with college and work lately.
                </div>

                <div className="max-w-[85%] rounded-3xl rounded-bl-md bg-slate-100 px-4 py-3 text-sm text-slate-700">
                  You're doing more than your mind is giving you credit for. Let’s slow things down
                  together.
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <Brain className="size-5 text-teal-500" />
                  <p className="mt-3 text-sm font-semibold text-slate-900">AI Therapy</p>
                  <p className="mt-1 text-xs text-slate-500">Emotion-aware guidance</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <Activity className="size-5 text-cyan-500" />
                  <p className="mt-3 text-sm font-semibold text-slate-900">Mood Tracking</p>
                  <p className="mt-1 text-xs text-slate-500">Daily emotional insights</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <Heart className="size-5 text-rose-500" />
                  <p className="mt-3 text-sm font-semibold text-slate-900">Wellness Tools</p>
                  <p className="mt-1 text-xs text-slate-500">Breathing & calm support</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Experience Section */}
        <section
          id="portals-section"
          className="relative mt-14 overflow-hidden rounded-[40px] border border-teal-100 bg-gradient-to-br from-[#ecfffb] via-[#f4fffd] to-[#e8fffa] px-6 py-20 text-slate-900 shadow-[0_20px_80px_rgba(20,184,166,0.08)] sm:px-10 lg:px-16"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(45,212,191,0.10),transparent_32%)]" />

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mx-auto max-w-3xl text-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-4 py-2 text-sm font-medium text-teal-700 shadow-sm backdrop-blur-xl">
                <Sparkles className="size-4" />
                Designed For Every Mind
              </div>

              <h2 className="mt-6 font-display text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
                One Platform.
                <br />
                Multiple Wellness Experiences.
              </h2>

              <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Whether you need emotional support, therapy tools, organisation wellness insights,
                or platform administration — MindGod adapts to your role beautifully.
              </p>
            </motion.div>

            <div className="mt-16 grid gap-6 lg:grid-cols-2">
              {PORTALS.map((p, i) => (
                <motion.a
                  key={p.id}
                  href={p.dest}
                  onClick={(e) => handlePortalClick(e, p.id, p.dest)}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="group relative overflow-hidden rounded-[32px] border border-teal-100 bg-white/80 p-7 shadow-lg backdrop-blur-2xl transition-all duration-300 hover:-translate-y-2 hover:border-teal-300 hover:bg-white hover:shadow-[0_25px_80px_rgba(20,184,166,0.12)]"
                >
                  <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-teal-300/20 blur-3xl transition-all duration-500 group-hover:scale-125" />

                  <div className="relative z-10 flex items-start justify-between gap-6">
                    <div>
                      <div
                        className={`flex size-16 items-center justify-center rounded-3xl shadow-xl ${p.iconBg}`}
                      >
                        <p.icon className="size-7" />
                      </div>

                      <h3 className="mt-6 font-display text-2xl font-bold text-slate-900">
                        {p.title}
                      </h3>

                      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
                        {p.subtitle}
                      </p>
                    </div>

                    <div className="rounded-full border border-teal-100 bg-teal-50 p-3 text-teal-700 transition group-hover:border-teal-300 group-hover:bg-teal-100">
                      <ChevronRight className="size-5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>

                  <div className="relative z-10 mt-8 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                    Enter Portal
                    <div className="h-px flex-1 bg-gradient-to-r from-teal-400/40 to-transparent" />
                  </div>
                </motion.a>
              ))}
            </div>

            <div className="relative z-10 mt-14 grid gap-5 lg:grid-cols-3">
              {[
                {
                  icon: MessageCircle,
                  title: "AI Conversations",
                  desc: "Emotion-aware conversations that feel deeply personal and calming.",
                },
                {
                  icon: Activity,
                  title: "Mental Insights",
                  desc: "Track mood patterns, emotional states, and wellness progress over time.",
                },
                {
                  icon: Wind,
                  title: "Calm Experiences",
                  desc: "Breathing exercises, grounding tools, and mindful recovery support.",
                },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className="rounded-[28px] border border-teal-100 bg-white/70 p-7 shadow-sm backdrop-blur-xl"
                >
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                    <feature.icon className="size-6" />
                  </div>

                  <h3 className="mt-5 text-xl font-semibold text-slate-900">{feature.title}</h3>

                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{feature.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="relative z-10 mt-14 rounded-[32px] border border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 p-8 shadow-sm backdrop-blur-xl">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
                    Unified Access
                  </p>

                  <h3 className="mt-3 font-display text-3xl font-bold text-slate-900">
                    One Login. Smart Role Detection.
                  </h3>

                  <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                    MindGod automatically detects your assigned role after sign-in and routes you to
                    the right dashboard experience instantly.
                  </p>
                </div>

                <a
                  href="#portals-section"
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-xl transition hover:scale-[1.03] hover:bg-slate-800"
                >
                  Continue To Sign In
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section
          id="about"
          className="mt-24 rounded-[40px] border border-slate-200 bg-white px-8 py-16 shadow-sm sm:px-12"
        >
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700">
              <Sparkles className="size-4" />
              About MindGod
            </div>

            <h2 className="mt-6 font-display text-4xl font-bold text-slate-900 sm:text-5xl">
              Built To Support Mental Wellness With AI
            </h2>

            <p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg">
              MindGod is an AI-powered emotional wellness platform designed to help people feel
              heard, supported, and emotionally stronger. The platform combines intelligent AI
              conversations, therapist connectivity, mood tracking, calming experiences, and
              organisation wellness tools into one seamless experience.
            </p>

            <div className="mt-10 grid gap-6 text-left md:grid-cols-3">
              <div className="rounded-3xl border border-teal-100 bg-teal-50/60 p-6">
                <Brain className="size-8 text-teal-600" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">AI Emotional Support</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Smart conversations that adapt to emotions and provide calming guidance.
                </p>
              </div>

              <div className="rounded-3xl border border-cyan-100 bg-cyan-50/60 p-6">
                <Heart className="size-8 text-rose-500" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">Human-Centered Care</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Connect with therapists and wellness experiences designed for real people.
                </p>
              </div>

              <div className="rounded-3xl border border-violet-100 bg-violet-50/60 p-6">
                <ShieldCheck className="size-8 text-violet-600" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">Private & Secure</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Your emotional wellness data stays protected with secure and private systems.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="mt-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-4 py-2 text-sm font-medium text-teal-700 shadow-sm">
              <Star className="size-4" />
              Trusted Wellness Experience
            </div>

            <h2 className="mt-6 font-display text-4xl font-bold text-slate-900 sm:text-5xl">
              Loved By Students,
              <br />
              Therapists & Teams.
            </h2>

            <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
              MindGod is designed to feel emotionally warm, calming, and deeply human.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {[
              {
                name: "Engineering Student",
                quote: "MindGod helped me calm my anxiety during stressful exam weeks.",
              },
              {
                name: "Therapist Portal User",
                quote: "The therapist dashboard feels modern, clean, and emotionally aware.",
              },
              {
                name: "HR Wellness Lead",
                quote: "The organisation analytics gave us meaningful wellness insights privately.",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="rounded-[30px] border border-teal-100 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-4 fill-amber-400" />
                  ))}
                </div>

                <p className="mt-5 text-sm leading-relaxed text-slate-600">“{t.quote}”</p>

                <div className="mt-6">
                  <p className="font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">MindGod User</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="mt-24 rounded-[40px] border border-slate-200 bg-white px-8 py-16 shadow-sm sm:px-12">
          <div className="grid gap-10 text-center sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: "24/7", label: "AI Support" },
              { value: "10+", label: "Wellness Tools" },
              { value: "100%", label: "Private Sessions" },
              { value: "4 Roles", label: "Unified Platform" },
            ].map((stat) => (
              <div key={stat.label}>
                <h3 className="text-4xl font-bold text-teal-600">{stat.value}</h3>
                <p className="mt-3 text-sm uppercase tracking-[0.25em] text-slate-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative mt-24 overflow-hidden rounded-[42px] bg-slate-900 px-8 py-20 text-white shadow-[0_30px_100px_rgba(15,23,42,0.35)] sm:px-12 lg:px-16">
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-teal-300 backdrop-blur-xl">
                <Globe2 className="size-4" />
                Future Of Emotional Wellness
              </div>

              <h2 className="mt-6 font-display text-4xl font-bold leading-tight sm:text-5xl">
                Your Mental Wellness Journey
                <br />
                Starts Today.
              </h2>

              <p className="mt-6 text-base leading-relaxed text-slate-300 sm:text-lg">
                Discover AI-powered emotional support, calming experiences, therapist connectivity,
                and wellness insights built for modern life.
              </p>
            </div>

            <a
              href="#portals-section"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 text-sm font-semibold text-slate-900 shadow-2xl transition hover:scale-[1.03]"
            >
              Start With MindGod
              <ArrowRight className="size-4" />
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-24 border-t border-slate-200 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 shadow-lg shadow-cyan-500/20 overflow-hidden">
                <img src={logoUrl} alt="MindGod Logo" className="size-full object-cover" />
              </div>

              <div>
                <p className="font-display text-lg font-bold text-slate-900">MindGod</p>
                <p className="text-xs text-slate-500">AI Mental Wellness Platform</p>
              </div>
            </div>

            <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-600">
              Emotion-aware AI wellness platform designed for individuals, therapists,
              organisations, and emotionally healthier digital experiences.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-900">
              Platform
            </h3>

            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <p>AI Conversations</p>
              <p>Mood Tracking</p>
              <p>Therapist Dashboard</p>
              <p>Organisation Wellness</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-900">
              Company
            </h3>

            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <p>About MindGod</p>
              <p>Privacy Policy</p>
              <p>Terms & Conditions</p>
              <p>Support Center</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-900">
              Stay Connected
            </h3>

            <div className="mt-5 flex items-center gap-3">
              <button className="flex size-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-teal-200 hover:text-teal-600">
                <Instagram className="size-5" />
              </button>

              <button className="flex size-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-teal-200 hover:text-teal-600">
                <Twitter className="size-5" />
              </button>

              <button className="flex size-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-teal-200 hover:text-teal-600">
                <Linkedin className="size-5" />
              </button>
            </div>

            <p className="mt-6 text-sm text-slate-500">© 2026 MindGod. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Super Admin Password Modal */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-800/50">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Shield className="size-4 text-violet-400" /> Super Admin Access
              </h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-400 mb-4">
                Please enter the portal password to proceed to the Super Admin sign-in.
              </p>

              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verifyAdminPassword()}
                placeholder="Enter password"
                autoFocus
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-violet-500 outline-none"
              />
              {error && <p className="text-xs text-red-400 mt-2 font-semibold">{error}</p>}
            </div>
            <div className="px-5 py-4 bg-slate-900 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  setAdminModalOpen(false);
                  setAdminPassword("");
                  setError("");
                }}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                disabled={!adminPassword || isVerifying}
                onClick={verifyAdminPassword}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition disabled:opacity-50"
              >
                {isVerifying ? "Verifying..." : "Proceed"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
