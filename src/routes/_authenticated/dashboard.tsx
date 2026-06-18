import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { AppShell } from "@/components/BottomNav";
import { CommodityCard } from "@/components/CommodityCard";
import { CURRENCIES, type Currency } from "@/lib/commodities";
import { getAllPrices } from "@/lib/prices.functions";
import { getProfile, updateProfile } from "@/lib/profile.functions";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading…</div>}>
        <DashboardInner />
      </Suspense>
    </AppShell>
  );
}

function DashboardInner() {
  const prices = useSuspenseQuery({
    queryKey: ["prices"],
    queryFn: () => getAllPrices(),
    refetchInterval: 60_000,
  });
  const profile = useSuspenseQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const qc = useQueryClient();
  const [currency, setCurrency] = useState<Currency>((profile.data?.currency ?? "USD") as Currency);

  const snapById = new Map(prices.data.snapshots.map((s) => [s.commodity_id, s]));

  async function changeCurrency(c: Currency) {
    setCurrency(c);
    await updateProfile({ data: { currency: c } });
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  const updated = new Date(prices.data.fetched_at).toLocaleTimeString();

  return (
    <div className="space-y-4 p-4">
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold">Live Dashboard</h1>
          <p className="text-[11px] text-muted-foreground">Updated {updated}</p>
        </div>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ["prices"] })}
          className="rounded-full p-2 hover:bg-accent"
          aria-label="Refresh"
        >
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </button>
      </header>

      <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4 pb-1">
        {CURRENCIES.map((c) => (
          <button
            key={c}
            onClick={() => changeCurrency(c)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              currency === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {prices.data.commodities.map((c) => {
          const s = snapById.get(c.id);
          if (!s) return null;
          return (
            <CommodityCard
              key={c.id}
              commodity={c}
              price={s.price}
              changePct={s.change_pct}
              sparkline={s.sparkline}
              currency={currency}
            />
          );
        })}
      </div>
    </div>
  );
}