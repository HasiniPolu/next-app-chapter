import { createFileRoute } from "@tanstack/react-router";
import { useState, Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Check, X, Crown } from "lucide-react";
import { getProfile } from "@/lib/profile.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pricing")({
  component: PricingPage,
});

function PricingPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading…</div>}>
        <Inner />
      </Suspense>
    </AppShell>
  );
}

const FEATURES = [
  { label: "Live commodity prices", free: true, premium: true },
  { label: "Personal watchlist", free: "10 items", premium: "Unlimited" },
  { label: "AI 24h forecasts", free: true, premium: true },
  { label: "AI 7-day & 30-day forecasts", free: false, premium: true },
  { label: "Price alerts", free: "3 active", premium: "Unlimited" },
  { label: "Compare up to 4 commodities", free: false, premium: true },
  { label: "Priority data refresh", free: false, premium: true },
];

function Inner() {
  const profile = useSuspenseQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const [annual, setAnnual] = useState(true);
  const isPremium = profile.data?.plan === "premium";

  async function upgrade() {
    toast.info("Payment flow coming soon — Stripe will be wired in once you confirm pricing.");
  }

  return (
    <div className="space-y-6 p-4">
      <header className="pt-2 text-center">
        <h1 className="text-2xl font-bold">Upgrade to Premium</h1>
        <p className="mt-1 text-sm text-muted-foreground">Unlock full AI forecasts, unlimited alerts, and more.</p>
      </header>

      <div className="mx-auto inline-flex items-center gap-1 rounded-full bg-secondary p-1">
        <button
          onClick={() => setAnnual(false)}
          className={`rounded-full px-3 py-1 text-xs font-medium ${!annual ? "bg-card shadow" : "text-muted-foreground"}`}
        >
          Monthly
        </button>
        <button
          onClick={() => setAnnual(true)}
          className={`rounded-full px-3 py-1 text-xs font-medium ${annual ? "bg-card shadow" : "text-muted-foreground"}`}
        >
          Annual <span className="ml-1 text-positive">−20%</span>
        </button>
      </div>

      <div className="space-y-3">
        <PlanCard
          name="Free"
          price="$0"
          period="forever"
          current={!isPremium}
          highlighted={false}
          features={FEATURES.map((f) => ({ label: f.label, included: f.free }))}
        />
        <PlanCard
          name="Premium"
          price={annual ? "$7.99" : "$9.99"}
          period={annual ? "/ month, billed annually" : "/ month"}
          current={isPremium}
          highlighted
          onSelect={upgrade}
          features={FEATURES.map((f) => ({ label: f.label, included: f.premium }))}
        />
      </div>

      <p className="text-center text-[10px] text-muted-foreground">Cancel anytime · Secure checkout via Stripe</p>
    </div>
  );
}

function PlanCard({
  name,
  price,
  period,
  features,
  highlighted,
  current,
  onSelect,
}: {
  name: string;
  price: string;
  period: string;
  features: { label: string; included: boolean | string }[];
  highlighted: boolean;
  current: boolean;
  onSelect?: () => void;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${highlighted ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          {highlighted && <Crown className="h-4 w-4 text-warning" />}
          <h3 className="text-lg font-semibold">{name}</h3>
        </div>
        <div className="text-right">
          <div className="num text-2xl font-bold">{price}</div>
          <div className="text-[10px] text-muted-foreground">{period}</div>
        </div>
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {features.map((f) => (
          <li key={f.label} className="flex items-center gap-2">
            {f.included ? (
              <Check className="h-4 w-4 shrink-0 text-positive" />
            ) : (
              <X className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className={f.included ? "" : "text-muted-foreground line-through"}>
              {f.label} {typeof f.included === "string" && <span className="text-muted-foreground">· {f.included}</span>}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-5">
        {current ? (
          <Button disabled variant="outline" className="w-full">Current plan</Button>
        ) : highlighted ? (
          <Button className="w-full" onClick={onSelect}>Upgrade now</Button>
        ) : null}
      </div>
    </div>
  );
}