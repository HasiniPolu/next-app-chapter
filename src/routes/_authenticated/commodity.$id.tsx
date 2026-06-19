import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { ArrowLeft, Star, Sparkles, Lock, Bell } from "lucide-react";
import { AppShell } from "@/components/BottomNav";
import { PriceChart } from "@/components/PriceChart";
import { Button } from "@/components/ui/button";
import { TIMEFRAMES, type Currency, type Timeframe } from "@/lib/commodities";
import { changeColor, formatChange, formatPrice } from "@/lib/format";
import { getCommodityDetail } from "@/lib/prices.functions";
import { getProfile } from "@/lib/profile.functions";
import { getAiForecast } from "@/lib/ai.functions";
import { addToWatchlist, getWatchlist, removeFromWatchlist } from "@/lib/watchlist.functions";
import { toast } from "sonner";
import { LiveDot } from "@/components/LiveDot";
import { useFlash } from "@/hooks/useFlash";
import { AlertSheet } from "@/components/AlertSheet";

export const Route = createFileRoute("/_authenticated/commodity/$id")({
  component: CommodityDetailPage,
});

function CommodityDetailPage() {
  return (
    <AppShell hideNav>
      <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading…</div>}>
        <Inner />
      </Suspense>
    </AppShell>
  );
}

function Inner() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tf, setTf] = useState<Timeframe>("1M");
  const [alertOpen, setAlertOpen] = useState(false);

  const profile = useSuspenseQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const currency = (profile.data?.currency ?? "USD") as Currency;
  const plan = profile.data?.plan ?? "free";

  const detail = useSuspenseQuery({
    queryKey: ["commodity", id, tf],
    queryFn: () => getCommodityDetail({ data: { id, timeframe: tf } }),
    refetchInterval: 5_000,
  });

  const watchlist = useSuspenseQuery({ queryKey: ["watchlist"], queryFn: () => getWatchlist() });
  const inWatch = watchlist.data.some((w) => w.commodity_id === id);

  const toggle = useMutation({
    mutationFn: async () => {
      if (inWatch) await removeFromWatchlist({ data: { commodity_id: id } });
      else await addToWatchlist({ data: { commodity_id: id } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlist"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const { commodity: c, snapshot: s, history } = detail.data;
  const positive = s.change_pct >= 0;
  const flash = useFlash(s.price);
  const priceFlash = flash === "up" ? "text-positive" : flash === "down" ? "text-negative" : "";

  return (
    <div className="pb-12">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background/95 px-3 py-3 backdrop-blur">
        <button onClick={() => navigate({ to: "/dashboard" })} aria-label="Back" className="rounded-full p-2 hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {c.icon ? (
              <span className="text-lg">{c.icon}</span>
            ) : (
              <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
                {c.symbol.slice(0, 2)}
              </span>
            )}
            <span className="font-semibold">{c.name}</span>
            {c.kind === "stock" && (
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
                Stock
              </span>
            )}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.symbol} · {c.exchange}</div>
        </div>
        <button
          onClick={() => setAlertOpen(true)}
          aria-label="Create alert"
          className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-primary"
        >
          <Bell className="h-5 w-5" />
        </button>
        <button
          onClick={() => toggle.mutate()}
          aria-label="Toggle watchlist"
          className={`rounded-full p-2 ${inWatch ? "text-primary" : "text-muted-foreground"} hover:bg-accent`}
        >
          <Star className="h-5 w-5" fill={inWatch ? "currentColor" : "none"} />
        </button>
      </header>

      <div className="space-y-6 p-4">
        <section>
          <div className="flex items-center gap-2">
            <LiveDot />
            <span className="text-[10px] text-muted-foreground">
              updated {new Date(s.fetched_at).toLocaleTimeString()}
            </span>
          </div>
          <div className={`num mt-1 text-4xl font-bold transition-colors duration-700 ${priceFlash}`}>
            {formatPrice(s.price, currency)}
          </div>
          <div className={`num mt-1 text-sm font-medium ${changeColor(s.change_pct)}`}>
            {formatPrice(s.change_abs, currency)} · {formatChange(s.change_pct)}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">per {c.unit}</p>
        </section>

        <section>
          <div className="mb-2 flex gap-1 overflow-x-auto">
            {TIMEFRAMES.map((t) => (
              <button
                key={t}
                onClick={() => setTf(t)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  tf === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <PriceChart data={history} positive={positive} currency={currency} />
        </section>

        <section className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-3 text-xs">
          <Stat label="Open" value={formatPrice(history[0]?.o ?? s.price, currency)} />
          <Stat label="High" value={formatPrice(s.high_24h, currency)} />
          <Stat label="Low" value={formatPrice(s.low_24h, currency)} />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">AI Forecast</h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">GPT-4o</span>
          </div>
          <ForecastCard id={id} horizon="24H" plan={plan} currency={currency} unit={c.unit} />
          <ForecastCard id={id} horizon="7D" plan={plan} currency={currency} unit={c.unit} locked={plan !== "premium"} />
          <ForecastCard id={id} horizon="30D" plan={plan} currency={currency} unit={c.unit} locked={plan !== "premium"} />
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            AI forecasts are generated using market signals and are for informational purposes only. Not financial advice.
          </p>
        </section>
      </div>
      {alertOpen && (
        <AlertSheet asset={c} currentPrice={s.price} onClose={() => setAlertOpen(false)} />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="num mt-0.5 text-sm font-semibold">{value}</div>
    </div>
  );
}

function ForecastCard({
  id,
  horizon,
  plan,
  currency,
  unit,
  locked,
}: {
  id: string;
  horizon: "24H" | "7D" | "30D";
  plan: string;
  currency: Currency;
  unit: string;
  locked?: boolean;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["forecast", id, horizon],
    queryFn: () => getAiForecast({ data: { id, horizon } }),
    enabled: !locked,
    staleTime: 30 * 60_000,
  });

  if (locked) {
    return (
      <div className="relative rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between blur-sm">
          <div>
            <div className="text-xs text-muted-foreground">{horizon} forecast</div>
            <div className="num text-lg font-semibold">$—.—</div>
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-background/70 backdrop-blur-sm">
          <Lock className="mb-1 h-4 w-4 text-primary" />
          <p className="text-xs font-medium">Premium feature</p>
          <Link to="/pricing" className="mt-1 text-[11px] text-primary underline">Upgrade →</Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="h-24 animate-pulse rounded-2xl bg-muted" />;
  }
  if (error || !data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
        Forecast unavailable.
      </div>
    );
  }

  const dir = data.direction ?? "flat";
  const tone = dir === "up" ? "text-positive" : dir === "down" ? "text-negative" : "text-muted-foreground";
  const conf = Math.round((data.confidence ?? 0.5) * 100);
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{horizon} forecast</div>
          <div className="num mt-1 text-lg font-semibold">
            {formatPrice(Number(data.predicted_price ?? 0), currency)}
            <span className="ml-1 text-xs text-muted-foreground">/ {unit}</span>
          </div>
          <div className={`mt-0.5 text-xs font-medium uppercase ${tone}`}>{dir}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-muted-foreground">Confidence</div>
          <div className="num text-sm font-semibold">{conf}%</div>
          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary capitalize">
            <Sparkles className="h-2.5 w-2.5" /> {data.sentiment}
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-foreground/80">{data.rationale}</p>
    </div>
  );
}