import { ArrowRight, BrainCircuit, HeartHandshake, ShieldCheck, Wind } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";

export function LandingPageView() {
  return (
    <div className="bg-hero-wash">
      <section className="container grid min-h-[calc(100vh-80px)] items-center gap-12 py-16 md:grid-cols-2">
        <div className="space-y-8">
          <div className="inline-flex rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Cultural empathy first
          </div>
          <div className="space-y-5">
            <h1 className="max-w-xl font-heading text-5xl font-semibold leading-tight text-primary md:text-6xl">
              Someone is here to listen.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-foreground/70">
              AI support, therapist care, mood reflection, and calm rituals in one warm space built
              for the Indian heart.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/onboarding">
              <Button className="gap-2">Talk to Manas <ArrowRight className="h-4 w-4" /></Button>
            </Link>
            <Link href="/therapists">
              <Button variant="coral">Find a Therapist</Button>
            </Link>
          </div>
        </div>
        <GlassCard className="relative overflow-hidden p-4">
          <div className="aspect-[0.92] rounded-[24px] bg-breathing-glow p-6">
            <div className="flex h-full flex-col justify-between rounded-[24px] bg-white/70 p-6">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Manas AI is active</p>
                <p className="font-heading text-3xl text-primary">
                  "Namaste. How is your heart feeling today?"
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { label: "Current streak", value: "12 days", hint: "Morning check-ins build resilience." },
                  { label: "Calm score", value: "78%", hint: "Breathing sessions are helping." }
                ].map((stat) => (
                  <div key={stat.label} className="rounded-[24px] bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-foreground/55">{stat.label}</p>
                    <p className="mt-2 font-heading text-2xl text-primary">{stat.value}</p>
                    <p className="mt-2 text-sm text-foreground/65">{stat.hint}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>
      </section>
      <section id="features" className="container space-y-10 py-20">
        <div className="max-w-2xl space-y-3">
          <h2 className="font-heading text-4xl font-semibold text-primary">Holistic support for your journey</h2>
          <p className="text-lg text-foreground/70">
            The product surface matches the Stitch references: spacious, calm, card-driven, and never clinical.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          <FeatureCard icon={BrainCircuit} title="AI emotional companion" body="Streaming emotional support with safety escalation and memory-aware conversations." className="md:col-span-2" />
          <FeatureCard icon={Wind} title="Breathing rituals" body="Grounding routines, timers, and audio-ready structures for calm transitions." />
          <FeatureCard icon={HeartHandshake} title="Therapist marketplace" body="RCI-aware discovery, booking, and LiveKit session readiness." />
          <FeatureCard icon={ShieldCheck} title="Safe by default" body="Crisis UI, secure cookies, input validation, and role-based access control." className="md:col-span-2" />
          <GlassCard className="md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">Therapist marketplace</p>
            <h3 className="mt-3 font-heading text-2xl text-primary">RCI-verified therapists</h3>
            <p className="mt-2 text-foreground/70">Browse, book, and join video sessions — all from one platform.</p>
            <Link href="/therapists" className="mt-4 block"><Button variant="outline">Explore therapists</Button></Link>
          </GlassCard>
        </div>
      </section>
      <section id="portals" className="container space-y-10 py-8">
        <div className="max-w-2xl space-y-3">
          <h2 className="font-heading text-4xl font-semibold text-primary">The Four Portals</h2>
          <p className="text-lg text-foreground/70">
            These are the four dashboards from the PDF. In this repo they are available as app routes.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <PortalCard
            title="Individual User"
            body="Chat with Manas, track mood, journal, breathing, therapist discovery."
            href="/onboarding?role=user&next=%2Fdashboard"
            cta="Sign in as user"
          />
          <PortalCard
            title="Therapist Portal"
            body="Sessions, earnings, availability, and therapist workflow."
            href="/onboarding?role=therapist&next=%2Ftherapist"
            cta="Sign in as therapist"
          />
          <PortalCard
            title="Org Admin"
            body="Team wellness analytics and organization insights."
            href="/onboarding?role=org_admin&next=%2Forg-admin"
            cta="Sign in as org admin"
          />
          <PortalCard
            title="Super Admin"
            body="Ops, therapist verification, and platform analytics."
            href="/onboarding?role=super_admin&next=%2Fsuper-admin"
            cta="Sign in as super admin"
          />
        </div>
      </section>
      <section id="stories" className="container py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {["I finally felt heard.", "It fit my life, not a hospital flow.", "The therapist handoff felt natural."].map((quote) => (
            <GlassCard key={quote}>
              <p className="font-heading text-2xl text-primary">{quote}</p>
              <p className="mt-4 text-sm leading-7 text-foreground/65">
                Warm gradients, spacious cards, and culturally aware guidance were the key product signals.
              </p>
            </GlassCard>
          ))}
        </div>
      </section>
    </div>
  );
}

function PortalCard({
  title,
  body,
  href,
  cta,
  disabled = false
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
  disabled?: boolean;
}) {
  return (
    <GlassCard>
      <h3 className="font-heading text-2xl text-primary">{title}</h3>
      <p className="mt-4 text-foreground/70">{body}</p>
      {disabled ? (
        <Button variant="ghost" className="mt-6 w-full" disabled>
          {cta}
        </Button>
      ) : (
        <Link href={href} className="mt-6 block">
          <Button className="w-full">{cta}</Button>
        </Link>
      )}
    </GlassCard>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
  className
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <GlassCard className={className}>
      <Icon className="h-8 w-8 text-primary" />
      <h3 className="mt-6 font-heading text-2xl text-primary">{title}</h3>
      <p className="mt-4 text-foreground/70">{body}</p>
    </GlassCard>
  );
}
