import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { AppShell } from "@/components/BottomNav";
import { CommodityCard } from "@/components/CommodityCard";
import { Sparkline } from "@/components/Sparkline";
import { changeColor, formatChange, formatPrice } from "@/lib/format";
import { FEATURED_IDS, type Currency } from "@/lib/commodities";
import { ALL_ASSETS } from "@/lib/assets";
import { getAllPrices, getTopMovers } from "@/lib/prices.functions";
import { getMarketDigest } from "@/lib/ai.functions";
import { getProfile } from "@/lib/profile.functions";
import { getWatchlist } from "@/lib/watchlist.functions";
import { Bell, Sparkles, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { ThemeButton } from "@/components/ThemeButton";

export const Route = createFileRoute("/_authenticated/home")({
  component: HomePage,
});

function useAll() {
  const prices = useSuspenseQuery({
    queryKey: ["prices"],
    queryFn: () => getAllPrices(),
    refetchInterval: 60_000,
  });
  const movers = useSuspenseQuery({ queryKey: ["movers"], queryFn: () => getTopMovers() });
  const digest = useSuspenseQuery({ queryKey: ["digest"], queryFn: () => getMarketDigest() });
  const profile = useSuspenseQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const watchlist = useSuspenseQuery({ queryKey: ["watchlist"], queryFn: () => getWatchlist() });
  return { prices, movers, digest, profile, watchlist };
}

function HomePage() {
  return (
    <AppShell>
      <Suspense fallback={<HomeSkeleton />}>
        <HomeInner />
      </Suspense>
    </AppShell>
  );
}

function HomeInner() {
  const { prices, movers, digest, profile, watchlist } = useAll();
  const currency = (profile.data?.currency ?? "USD") as Currency;
  const snapById = new Map(prices.data.snapshots.map((s) => [s.commodity_id, s]));
  const featured = ALL_ASSETS.filter((c) => FEATURED_IDS.includes(c.id));
  const watchedItems = watchlist.data
    .map((w) => ALL_ASSETS.find((c) => c.id === w.commodity_id))
    .filter(Boolean);

  return (
    <div className="space-y-6 p-4">
      {/* Top bar */}
      <header className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight">SentiMarket</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeButton />
          <button aria-label="Notifications" className="rounded-full p-2 hover:bg-accent">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Greeting */}
      <section>
        <h1 className="text-2xl font-bold leading-tight">{digest.data.greeting}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{digest.data.digest}</p>
      </section>

      {/* Watchlist scroller */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your watchlist</h2>
          <Link to="/watchlist" className="text-xs text-primary">Manage</Link>
        </div>
        {watchedItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">Add commodities to your watchlist to track them here.</p>
            <Link to="/dashboard" className="mt-3 inline-block text-sm font-medium text-primary">Browse commodities →</Link>
          </div>
        ) : (
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {watchedItems.map((c) => {
              const s = snapById.get(c!.id)!;
              return (
                <CommodityCard
                  key={c!.id}
                  commodity={c!}
                  price={s.price}
                  changePct={s.change_pct}
                  sparkline={s.sparkline}
                  currency={currency}
                  compact
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Featured grid */}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Featured</h2>
        <div className="grid grid-cols-2 gap-3">
          {featured.map((c) => {
            const s = snapById.get(c.id)!;
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
      </section>

      {/* Top movers */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Top movers</h2>
        <MoversList title="Gainers" items={movers.data.gainers} icon={ArrowUpRight} positive currency={currency} />
        <MoversList title="Losers" items={movers.data.losers} icon={ArrowDownRight} positive={false} currency={currency} />
      </section>

      {/* AI insight teaser */}
      <section>
        <Link
          to="/commodity/$id"
          params={{ id: "gold" }}
          className="block rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-4"
        >
          <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" /> AI Insight · powered by GPT-4o
          </div>
          <p className="text-sm text-foreground">
            Tap any commodity to see live AI forecasts for 24h, 7d and 30d, with confidence scores and rationale.
          </p>
        </Link>
      </section>
    </div>
  );
}

function MoversList({
  title,
  items,
  icon: Icon,
  positive,
  currency,
}: {
  title: string;
  items: { commodity_id: string; price: number; change_pct: number; sparkline: number[] }[];
  icon: React.ComponentType<{ className?: string }>;
  positive: boolean;
  currency: Currency;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-2 text-xs font-semibold">
        <Icon className={`h-3.5 w-3.5 ${positive ? "text-positive" : "text-negative"}`} />
        {title}
      </div>
      <ul>
        {items.map((item) => {
          const c = ALL_ASSETS.find((x) => x.id === item.commodity_id);
          if (!c) return null;
          return (
            <li key={c.id}>
              <Link
                to="/commodity/$id"
                params={{ id: c.id }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent"
              >
                <span className="text-base">{c.icon}</span>
                <span className="flex-1 text-sm font-medium">{c.name}</span>
                <div className="h-7 w-14 shrink-0">
                  <Sparkline data={item.sparkline} positive={item.change_pct >= 0} />
                </div>
                <div className="text-right">
                  <div className="num text-sm font-semibold">{formatPrice(item.price, currency)}</div>
                  <div className={`num text-[11px] ${changeColor(item.change_pct)}`}>{formatChange(item.change_pct)}</div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="h-8 w-1/2 animate-pulse rounded bg-muted" />
      <div className="h-32 animate-pulse rounded-2xl bg-muted" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}