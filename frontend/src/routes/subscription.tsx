import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Zap, Crown, Loader, AlertCircle } from "lucide-react";
import API from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/subscription")({
  component: SubscriptionPage,
});

const TIERS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "Forever",
    description: "Start your mental wellness journey",
    icon: null,
    features: [
      { text: "7 AI messages per day", included: true },
      { text: "7 CBT journal entries/week", included: true },
      { text: "7-day mood calendar", included: true },
      { text: "All 5 breathing exercises", included: true },
      { text: "10% therapist discount", included: false },
      { text: "Priority booking", included: false },
      { text: "Crisis line 24/7", included: true },
    ],
    cta: "Current Plan",
    recommended: false,
  },
  {
    id: "mann_shanti",
    name: "Mann Shanti",
    price: 199,
    period: "/mo",
    description: "Unlock more conversations",
    icon: Zap,
    features: [
      { text: "100 AI messages per day", included: true },
      { text: "Unlimited journal entries", included: true },
      { text: "30-day mood calendar", included: true },
      { text: "All 5 breathing exercises", included: true },
      { text: "10% therapist discount", included: true },
      { text: "Priority booking", included: true },
      { text: "Crisis line 24/7", included: true },
    ],
    cta: "Upgrade Now",
    recommended: true,
  },
  {
    id: "apna_therapist",
    name: "Apna Therapist",
    price: 499,
    period: "/mo",
    description: "Premium therapy experience",
    icon: Crown,
    features: [
      { text: "Unlimited AI messages", included: true },
      { text: "Unlimited journal entries", included: true },
      { text: "30-day mood calendar", included: true },
      { text: "All 5 breathing exercises", included: true },
      { text: "20% therapist discount", included: true },
      { text: "Priority booking + instant access", included: true },
      { text: "Crisis line 24/7", included: true },
    ],
    cta: "Upgrade Now",
    recommended: false,
  },
] as const;

type TierId = typeof TIERS[number]["id"];

function SubscriptionPage() {
  const qc = useQueryClient();
  const [upgrading, setUpgrading] = useState<TierId | null>(null);

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => API.subscription.get(),
    retry: false,
  });

  const upgradeMutation = useMutation({
    mutationFn: (tier: "mann_shanti" | "apna_therapist") =>
      API.subscription.upgrade({ tier }),
    onSuccess: (data, tier) => {
      qc.invalidateQueries({ queryKey: ["subscription"] });
      setUpgrading(null);
      if (data.shortUrl) {
        // Open Razorpay hosted page for subscription payment
        window.open(data.shortUrl, "_blank");
        toast.success("Redirecting to payment…");
      } else {
        toast.success("Subscription activated!");
      }
    },
    onError: (e: Error) => {
      setUpgrading(null);
      toast.error(e.message);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => API.subscription.cancel(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription"] });
      toast.success("Subscription cancelled. You've been moved to Free.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const currentTier = subscription?.tier ?? "free";

  const handleUpgrade = (tier: TierId) => {
    if (tier === "free" || tier === currentTier) return;
    setUpgrading(tier);
    upgradeMutation.mutate(tier as "mann_shanti" | "apna_therapist");
  };

  return (
    <AppShell>
      <div className="space-y-8 py-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
          <h1 className="font-display text-3xl font-bold text-primary-deep">Choose Your Plan</h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Recurring billing via Razorpay. Cancel anytime.
          </p>
        </motion.div>

        {/* Usage summary for current user */}
        {subscription && !isLoading && (
          <div className="rounded-2xl bg-primary-soft/50 border border-primary/20 p-4 text-center space-y-1">
            <p className="text-sm font-semibold text-primary-deep">
              Current: <span className="font-bold">{subscription.tierLabel}</span>
            </p>
            {subscription.usage.dailyLimit !== null && (
              <p className="text-xs text-muted-foreground">
                {subscription.usage.messagesUsedToday} / {subscription.usage.dailyLimit} messages used today
              </p>
            )}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="space-y-4">
          {TIERS.map((tier, idx) => {
            const isCurrent = currentTier === tier.id;
            const isUpgrading = upgrading === tier.id && upgradeMutation.isPending;

            return (
              <motion.div key={tier.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}>
                <Card className={`relative p-6 transition-all ${
                  tier.recommended ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"
                } ${isCurrent ? "border-green-400 bg-green-50/50" : ""}`}>

                  {tier.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold">
                      Most Popular
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-3 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      ✓ Active
                    </div>
                  )}
                  {subscription?.subscription?.status === 'pending' && subscription?.subscription?.plan === tier.name && (
                    <div className="absolute -top-3 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Payment Pending
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {tier.icon && <tier.icon className="size-5 text-primary" />}
                        <h3 className="font-display text-xl font-bold text-primary-deep">{tier.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{tier.description}</p>
                    </div>
                    <div className="text-right">
                      {tier.price === 0 ? (
                        <span className="text-2xl font-black text-primary-deep">Free</span>
                      ) : (
                        <>
                          <span className="text-2xl font-black text-primary-deep">₹{tier.price}</span>
                          <span className="text-sm text-muted-foreground">{tier.period}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-5">
                    {tier.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className={`size-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                          f.included ? "bg-green-100" : "bg-muted"
                        }`}>
                          {f.included && <Check className="size-2.5 text-green-600" />}
                        </div>
                        <span className={`text-sm ${f.included ? "text-foreground" : "text-muted-foreground line-through"}`}>
                          {f.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  {isCurrent ? (
                    <div className="space-y-2">
                      <Button disabled variant="outline" className="w-full rounded-xl">✓ Current Plan</Button>
                      {currentTier !== "free" && (
                        <button onClick={() => cancelMutation.mutate()}
                          disabled={cancelMutation.isPending}
                          className="w-full text-xs text-muted-foreground hover:text-destructive transition text-center py-1">
                          {cancelMutation.isPending ? "Cancelling…" : "Cancel subscription"}
                        </button>
                      )}
                    </div>
                  ) : tier.id === "free" ? (
                    <Button disabled variant="outline" className="w-full rounded-xl">Downgrade to Free</Button>
                  ) : (
                    <Button onClick={() => handleUpgrade(tier.id)} disabled={isUpgrading}
                      className={`w-full rounded-xl ${tier.recommended ? "" : "bg-primary/80 hover:bg-primary"}`}>
                      {isUpgrading ? (
                        <><Loader className="size-4 mr-2 animate-spin" /> Creating subscription…</>
                      ) : tier.cta}
                    </Button>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Info */}
        <div className="flex items-start gap-3 rounded-2xl bg-muted/50 p-4">
          <AlertCircle className="size-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Subscriptions are billed monthly via Razorpay. You'll be redirected to a secure hosted payment page.
            Cancel anytime from this page — takes effect at end of billing period.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
