import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";

const tiers = [
  { name: "Free tier", price: "₹0", details: "Daily mood check-ins and limited Manas chats." },
  { name: "Mann Shanti", price: "₹499/mo", details: "Unlimited AI support, journaling, breathing, and insights." },
  { name: "Apna Therapist", price: "₹1,999/mo", details: "Includes premium AI plus therapist booking benefits." }
];

export default function PricingPage() {
  return (
    <main className="container py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-heading text-5xl text-primary">Support when you need more of it</h1>
        <p className="mt-4 text-lg text-foreground/70">Paywall only appears after free limits are genuinely useful, not before.</p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {tiers.map((tier, index) => (
          <GlassCard key={tier.name} className={index === 1 ? "border-primary/30 bg-primary/5" : ""}>
            <h2 className="font-heading text-3xl text-primary">{tier.name}</h2>
            <p className="mt-4 font-heading text-4xl text-foreground">{tier.price}</p>
            <p className="mt-4 text-foreground/70">{tier.details}</p>
            <Button className="mt-8 w-full">{index === 0 ? "Start free" : "Choose plan"}</Button>
          </GlassCard>
        ))}
      </div>
    </main>
  );
}
