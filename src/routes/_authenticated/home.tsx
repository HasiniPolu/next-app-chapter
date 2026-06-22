import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { AppShell } from "@/components/BottomNav";
import { CommodityCard } from "@/components/CommodityCard";
import { changeColor, formatChange, formatPrice } from "@/lib/format";
import { FEATURED_IDS, type Currency } from "@/lib/commodities";
import { ALL_ASSETS } from "@/lib/assets";
import { getAllPrices, getTopMovers } from "@/lib/prices.functions";
import { getMarketDigest } from "@/lib/ai.functions";
import { getProfile } from "@/lib/profile.functions";
import { getWatchlist } from "@/lib/watchlist.functions";
import { Bell, Sparkles, ArrowUpRight, ArrowDownRight, Newspaper } from "lucide-react";
import { ThemeButton } from "@/components/ThemeButton";
import { LiveDot } from "@/components/LiveDot";
import { NEWS, relativeTime } from "@/lib/news";

export const Route = createFileRoute("/_authenticated/home")({
  component: HomePage,
});

function useAll() {
  const prices = useSuspenseQuery({
    queryKey: ["prices"],
    queryFn: () => getAllPrices(),
    refetchInterval: 5_000,
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
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-gold to-gold/60 text-gold-foreground shadow-[0_4px_14px_-4px_color-mix(in_oklab,var(--gold)_60%,transparent)]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg">SentiMarket</div>
            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-kicker text-muted-foreground">
              <LiveDot />
              <span>Live markets</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThemeButton />
          <Link to="/alerts" aria-label="Alerts" className="rounded-full p-2 hover:bg-accent">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </Link>
        </div>
      </header>

      {/* Editorial header */}
      <section className="border-b border-border pb-5">
        <div className="num text-[10px] uppercase tracking-kicker text-gold">
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </div>
        <h1 className="font-display mt-1.5 text-4xl leading-[1.05] text-foreground">
          {digest.data.greeting}
        </h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">{digest.data.digest}</p>
      </section>

      {/* Watchlist scroller */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-[10px] font-semibold uppercase tracking-kicker text-muted-foreground">Your watchlist</h2>
          <Link to="/watchlist" className="num text-[10px] uppercase tracking-kicker text-gold hover:underline">Manage →</Link>
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
        <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-kicker text-muted-foreground">Featured</h2>
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
        <h2 className="text-[10px] font-semibold uppercase tracking-kicker text-muted-foreground">Top movers</h2>
        <MoversList title="Gainers" items={movers.data.gainers} icon={ArrowUpRight} positive currency={currency} />
        <MoversList title="Losers" items={movers.data.losers} icon={ArrowDownRight} positive={false} currency={currency} />
      </section>

      {/* Latest news rail */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-[10px] font-semibold uppercase tracking-kicker text-muted-foreground">Latest news</h2>
          <Link to="/news" className="num text-[10px] uppercase tracking-kicker text-gold hover:underline">See all →</Link>
        </div>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
          {NEWS.slice(0, 5).map((n) => (
            <Link
              key={n.id}
              to="/news"
              className="block w-64 shrink-0 rounded-2xl border border-border bg-card p-3"
            >
              <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <Newspaper className="h-3 w-3" />
                <span className="font-semibold text-foreground/80">{n.source}</span>
                <span>·</span>
                <span>{relativeTime(n.publishedAt)}</span>
              </div>
              <p className="line-clamp-3 text-sm font-medium leading-snug text-foreground">{n.title}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* AI insight teaser */}
      <section>
        <Link
          to="/commodity/$id"
          params={{ id: "gold" }}
          className="relative block overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/12 via-card to-card p-5"
        >
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/15 blur-2xl" />
          <div className="relative">
            <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-kicker text-gold">
              <Sparkles className="h-3 w-3" /> AI Insight · GPT-4o
            </div>
            <p className="font-display text-xl leading-snug text-foreground">
              Live forecasts for every asset.
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Tap any commodity to see 24h, 7d and 30d projections with confidence scores and rationale.
            </p>
          </div>
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
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-kicker">
          <Icon className={`h-3 w-3 ${positive ? "text-positive" : "text-negative"}`} />
          {title}
        </div>
        <span className="num text-[9px] uppercase tracking-kicker text-muted-foreground">24h</span>
      </div>
      <ul className="divide-y divide-border/60">
        {items.map((item) => {
          const c = ALL_ASSETS.find((x) => x.id === item.commodity_id);
          if (!c) return null;
          return (
            <li key={c.id}>
              <Link
                to="/commodity/$id"
                params={{ id: c.id }}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/60"
              >
                <span className="text-base">{c.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-base leading-tight">{c.name}</div>
                  <div className="num text-[10px] uppercase tracking-kicker text-muted-foreground">{c.symbol}</div>
                </div>
                <div className="text-right">
                  <div className="num text-sm font-medium tabular-nums">{formatPrice(item.price, currency)}</div>
                  <div className={`num text-[11px] tabular-nums ${changeColor(item.change_pct)}`}>{formatChange(item.change_pct)}</div>
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