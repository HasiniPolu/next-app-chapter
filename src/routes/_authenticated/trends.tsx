import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useMemo, useState } from "react";
import { AppShell } from "@/components/BottomNav";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getAllPrices, getTopMovers, getTrends } from "@/lib/prices.functions";
import { ALL_ASSETS } from "@/lib/assets";
import { TIMEFRAMES, type Timeframe, type Currency } from "@/lib/commodities";
import { getProfile } from "@/lib/profile.functions";
import { changeColor, formatChange, formatPrice } from "@/lib/format";
import { ArrowDownRight, ArrowUpRight, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/trends")({
  component: TrendsPage,
});

function TrendsPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading…</div>}>
        <TrendsInner />
      </Suspense>
    </AppShell>
  );
}

const CHART_COLORS = ["var(--primary)", "var(--positive)", "var(--negative)"];

function TrendsInner() {
  const prices = useSuspenseQuery({
    queryKey: ["prices"],
    queryFn: () => getAllPrices(),
    refetchInterval: 5_000,
  });
  const movers = useSuspenseQuery({ queryKey: ["movers"], queryFn: () => getTopMovers(), refetchInterval: 10_000 });
  const profile = useSuspenseQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const currency = (profile.data?.currency ?? "USD") as Currency;

  const [tf, setTf] = useState<Timeframe>("1M");
  const [picks, setPicks] = useState<string[]>(["gold", "crude-wti", "spy"]);

  const trends = useSuspenseQuery({
    queryKey: ["trends", picks.join(","), tf],
    queryFn: () => getTrends({ data: { ids: picks, timeframe: tf } }),
  });

  // Category sentiment from current snapshots
  const sentiment = useMemo(() => {
    const byKind: Record<string, number[]> = {};
    for (const s of prices.data.snapshots) {
      const a = ALL_ASSETS.find((x) => x.id === s.commodity_id);
      if (!a) continue;
      const bucket = a.kind === "stock" ? "Stocks" : a.category;
      byKind[bucket] = byKind[bucket] ?? [];
      byKind[bucket].push(s.change_pct);
    }
    return Object.entries(byKind).map(([k, arr]) => ({
      key: k,
      avg: arr.reduce((s, n) => s + n, 0) / arr.length,
      count: arr.length,
    }));
  }, [prices.data.snapshots]);

  // Overlay chart data — merge series by timestamp index
  const overlay = useMemo(() => {
    if (trends.data.series.length === 0) return [];
    const len = Math.min(...trends.data.series.map((s) => s.points.length));
    const out: Array<Record<string, number>> = [];
    for (let i = 0; i < len; i++) {
      const row: Record<string, number> = { t: trends.data.series[0].points[i].t };
      for (const s of trends.data.series) {
        row[s.id] = s.points[i].pct;
      }
      out.push(row);
    }
    return out;
  }, [trends.data.series]);

  function togglePick(id: string) {
    setPicks((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : p.length < 3 ? [...p, id] : [...p.slice(1), id],
    );
  }

  return (
    <div className="space-y-5 p-4">
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold">Trends</h1>
          <p className="text-xs text-muted-foreground">Multi-asset performance &amp; market sentiment</p>
        </div>
        <TrendingUp className="h-5 w-5 text-primary" />
      </header>

      {/* Sentiment gauges */}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Sector sentiment (24h)
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {sentiment.map((s) => {
            const dir = s.avg >= 0;
            return (
              <div key={s.key} className="rounded-2xl border border-border bg-card p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.key}</div>
                <div className={`num mt-1 text-lg font-semibold ${changeColor(s.avg)}`}>
                  {formatChange(s.avg)}
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full ${dir ? "bg-positive" : "bg-negative"}`}
                    style={{ width: `${Math.min(100, Math.abs(s.avg) * 20)}%` }}
                  />
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">{s.count} assets</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Overlay chart */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Comparison overlay
          </h2>
          <div className="flex gap-1">
            {TIMEFRAMES.map((t) => (
              <button
                key={t}
                onClick={() => setTf(t)}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  tf === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="h-56 w-full min-w-0 overflow-hidden rounded-2xl border border-border bg-card p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={overlay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="t"
                stroke="var(--muted-foreground)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(t) => new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                minTickGap={40}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={36}
                tickFormatter={(v) => `${v.toFixed(0)}%`}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelFormatter={(t) => new Date(t as number).toLocaleString()}
                formatter={(v: number) => `${v.toFixed(2)}%`}
              />
              {trends.data.series.map((s, i) => (
                <Line
                  key={s.id}
                  type="monotone"
                  dataKey={s.id}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                  name={s.name}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {ALL_ASSETS.slice(0, 16).map((a) => {
            const active = picks.includes(a.id);
            return (
              <button
                key={a.id}
                onClick={() => togglePick(a.id)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40"
                }`}
              >
                {a.symbol}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">Tap up to 3 assets to compare normalized % change.</p>
      </section>

      {/* Top movers */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Top movers</h2>
        <MoversCard title="Gainers" items={movers.data.gainers} positive currency={currency} />
        <MoversCard title="Losers" items={movers.data.losers} positive={false} currency={currency} />
      </section>
    </div>
  );
}

function MoversCard({
  title,
  items,
  positive,
  currency,
}: {
  title: string;
  items: { commodity_id: string; price: number; change_pct: number; sparkline: number[] }[];
  positive: boolean;
  currency: Currency;
}) {
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-2 text-xs font-semibold">
        <Icon className={`h-3.5 w-3.5 ${positive ? "text-positive" : "text-negative"}`} />
        {title}
      </div>
      <ul>
        {items.map((item) => {
          const a = ALL_ASSETS.find((x) => x.id === item.commodity_id);
          if (!a) return null;
          return (
            <li key={a.id}>
              <Link
                to="/commodity/$id"
                params={{ id: a.id }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent"
              >
                <span className="text-base">{a.icon || a.symbol.slice(0, 2)}</span>
                <span className="flex-1 truncate text-sm font-medium">{a.name}</span>
                <div className="text-right">
                  <div className="num text-sm font-semibold">{formatPrice(item.price, currency)}</div>
                  <div className={`num text-[11px] ${changeColor(item.change_pct)}`}>
                    {formatChange(item.change_pct)}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}