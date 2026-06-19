import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/BottomNav";
import { CATEGORY_LABEL, NEWS, relativeTime, type NewsCategory } from "@/lib/news";
import { getAsset } from "@/lib/assets";
import { Newspaper, Search, TrendingUp, TrendingDown, Minus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/news")({
  component: NewsPage,
});

const CATEGORIES: ("all" | NewsCategory)[] = ["all", "metals", "energy", "fuel", "stocks", "macro"];

function NewsPage() {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return NEWS.filter((n) => (cat === "all" ? true : n.category === cat)).filter((n) =>
      q ? (n.title + n.summary).toLowerCase().includes(q.toLowerCase()) : true,
    );
  }, [cat, q]);

  return (
    <AppShell>
      <div className="space-y-4 p-4">
        <header className="pt-2">
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Market News</h1>
          </div>
          <p className="text-xs text-muted-foreground">Curated headlines tagged by sentiment.</p>
        </header>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search news…"
            className="w-full rounded-full border border-border bg-card py-2.5 pl-9 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                cat === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              {c === "all" ? "All" : CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>

        <ul className="space-y-3">
          {filtered.map((n) => (
            <li key={n.id}>
              <article className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span className="font-semibold text-foreground/80">{n.source}</span>
                  <span>{relativeTime(n.publishedAt)}</span>
                </div>
                <h3 className="text-sm font-semibold leading-snug text-foreground">{n.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{n.summary}</p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <SentimentChip sentiment={n.sentiment} />
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                    {CATEGORY_LABEL[n.category]}
                  </span>
                  {n.relatedIds.slice(0, 3).map((id) => {
                    const a = getAsset(id);
                    if (!a) return null;
                    return (
                      <Link
                        key={id}
                        to="/commodity/$id"
                        params={{ id }}
                        className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-foreground/80 hover:border-primary hover:text-primary"
                      >
                        {a.symbol}
                      </Link>
                    );
                  })}
                </div>
              </article>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No headlines match your filter.
            </li>
          )}
        </ul>
      </div>
    </AppShell>
  );
}

function SentimentChip({ sentiment }: { sentiment: "bullish" | "bearish" | "neutral" }) {
  const map = {
    bullish: { label: "Bullish", cls: "bg-positive/10 text-positive", Icon: TrendingUp },
    bearish: { label: "Bearish", cls: "bg-negative/10 text-negative", Icon: TrendingDown },
    neutral: { label: "Neutral", cls: "bg-muted text-muted-foreground", Icon: Minus },
  }[sentiment];
  const Icon = map.Icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${map.cls}`}>
      <Icon className="h-3 w-3" />
      {map.label}
    </span>
  );
}