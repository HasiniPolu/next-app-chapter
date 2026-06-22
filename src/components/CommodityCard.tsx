import { Link } from "@tanstack/react-router";
import type { Currency } from "@/lib/commodities";
import type { Asset } from "@/lib/assets";
import { changeColor, formatChange, formatPrice } from "@/lib/format";
import { useFlash } from "@/hooks/useFlash";

export interface CommodityCardProps {
  commodity: Asset;
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
  const flash = useFlash(price);
  const flashClass =
    flash === "up" ? "bg-positive/10" : flash === "down" ? "bg-negative/10" : "";
  return (
    <Link
      to="/commodity/$id"
      params={{ id: commodity.id }}
      className={`group relative block overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all duration-500 hover:border-gold/50 hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--gold)_25%,transparent),0_18px_40px_-20px_color-mix(in_oklab,var(--gold)_30%,transparent)] ${flashClass} ${
        compact ? "min-w-[180px]" : ""
      }`}
    >
      {/* Top row: ticker + kind badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {commodity.icon ? (
              <span className="text-base leading-none">{commodity.icon}</span>
            ) : (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm bg-gold/15 text-[10px] font-semibold text-gold">
                {commodity.symbol.slice(0, 2)}
              </span>
            )}
            <span className="num text-[10px] font-medium uppercase tracking-kicker text-muted-foreground">
              {commodity.symbol}
            </span>
          </div>
          <div className="mt-1.5 truncate font-display text-lg text-foreground">
            {commodity.name}
          </div>
        </div>
        <span
          className={`num shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
            positive
              ? "bg-positive/15 text-positive"
              : "bg-negative/15 text-negative"
          }`}
        >
          {formatChange(changePct)}
        </span>
      </div>

      {/* Hairline divider */}
      <div className="mt-3 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Price row */}
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className={`num text-[22px] font-medium tracking-tight ${changeColor(changePct)}`}>
          {formatPrice(price, currency)}
        </div>
        <span className="text-[10px] uppercase tracking-kicker text-muted-foreground/70">
          {commodity.unit}
        </span>
      </div>
    </Link>
  );
}