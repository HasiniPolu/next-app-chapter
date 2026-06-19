import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { AppShell } from "@/components/BottomNav";
import { CommodityCard } from "@/components/CommodityCard";
import { Button } from "@/components/ui/button";
import { type Currency } from "@/lib/commodities";
import { ALL_ASSETS } from "@/lib/assets";
import { getAllPrices } from "@/lib/prices.functions";
import { getProfile } from "@/lib/profile.functions";
import { addToWatchlist, getWatchlist, removeFromWatchlist } from "@/lib/watchlist.functions";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/watchlist")({
  component: WatchlistPage,
});

function WatchlistPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading…</div>}>
        <Inner />
      </Suspense>
    </AppShell>
  );
}

function Inner() {
  const qc = useQueryClient();
  const profile = useSuspenseQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const prices = useSuspenseQuery({
    queryKey: ["prices"],
    queryFn: () => getAllPrices(),
    refetchInterval: 5_000,
  });
  const watchlist = useSuspenseQuery({ queryKey: ["watchlist"], queryFn: () => getWatchlist() });
  const currency = (profile.data?.currency ?? "USD") as Currency;
  const snapById = new Map(prices.data.snapshots.map((s) => [s.commodity_id, s]));

  const remove = useMutation({
    mutationFn: (cid: string) => removeFromWatchlist({ data: { commodity_id: cid } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlist"] }),
  });

  const add = useMutation({
    mutationFn: (cid: string) => addToWatchlist({ data: { commodity_id: cid } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlist"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const watchedIds = new Set(watchlist.data.map((w) => w.commodity_id));
  const available = ALL_ASSETS.filter((c) => !watchedIds.has(c.id));

  return (
    <div className="space-y-6 p-4">
      <header className="pt-2">
        <h1 className="text-xl font-bold">My Watchlist</h1>
        <p className="text-xs text-muted-foreground">{watchlist.data.length} tracked</p>
      </header>

      {watchlist.data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">Start tracking commodities you care about.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {watchlist.data.map((w) => {
            const c = ALL_ASSETS.find((x) => x.id === w.commodity_id);
            const s = c ? snapById.get(c.id) : undefined;
            if (!c || !s) return null;
            return (
              <li key={w.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <CommodityCard
                    commodity={c}
                    price={s.price}
                    changePct={s.change_pct}
                    sparkline={s.sparkline}
                    currency={currency}
                  />
                </div>
                <button
                  onClick={() => remove.mutate(c.id)}
                  aria-label="Remove"
                  className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-negative"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Add commodity</h2>
        <ul className="space-y-1">
          {available.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2">
              <div className="flex items-center gap-2">
                <span>{c.icon}</span>
                <span className="text-sm font-medium">{c.name}</span>
              </div>
              <button onClick={() => add.mutate(c.id)} className="rounded-full p-1.5 text-primary hover:bg-primary/10" aria-label={`Add ${c.name}`}>
                <Plus className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}