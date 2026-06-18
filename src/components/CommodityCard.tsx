import { Link } from "@tanstack/react-router";
import type { Commodity, Currency } from "@/lib/commodities";
import { changeColor, formatChange, formatPrice } from "@/lib/format";
import { Sparkline } from "./Sparkline";

export interface CommodityCardProps {
  commodity: Commodity;
  price: number;
  changePct: number;
  sparkline: number[];
  currency?: Currency;
  compact?: boolean;
}

export function CommodityCard({
  commodity,
  price,
  changePct,
  sparkline,
  currency = "USD",
  compact,
}: CommodityCardProps) {
  const positive = changePct >= 0;
  return (
    <Link
      to="/commodity/$id"
      params={{ id: commodity.id }}
      className={`group block rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 ${
        compact ? "min-w-[170px]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base">{commodity.icon}</span>
            <span className="text-sm font-semibold text-foreground">{commodity.name}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {commodity.symbol} · {commodity.unit}
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          <div className="num text-xl font-semibold text-foreground">
            {formatPrice(price, currency)}
          </div>
          <div className={`num text-xs font-medium ${changeColor(changePct)}`}>
            {formatChange(changePct)}
          </div>
        </div>
        <div className="h-12 w-20 shrink-0">
          <Sparkline data={sparkline} positive={positive} />
        </div>
      </div>
    </Link>
  );
}