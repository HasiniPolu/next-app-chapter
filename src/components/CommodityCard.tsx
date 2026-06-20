import { Link } from "@tanstack/react-router";
import type { Currency } from "@/lib/commodities";
import type { Asset } from "@/lib/assets";
import { changeColor, formatChange, formatPrice } from "@/lib/format";
import { Sparkline } from "./Sparkline";
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
      className={`group block overflow-hidden rounded-2xl border border-border bg-card p-4 transition-colors duration-700 hover:border-primary/40 ${flashClass} ${
        compact ? "min-w-[170px]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            {commodity.icon ? (
              <span className="text-base">{commodity.icon}</span>
            ) : (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
                {commodity.symbol.slice(0, 2)}
              </span>
            )}
            <span className="text-sm font-semibold text-foreground">{commodity.name}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {commodity.symbol} · {commodity.unit}
          </span>
        </div>
        {commodity.kind === "stock" && (
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
            Stock
          </span>
        )}
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
        <div className="h-12 w-20 shrink-0 overflow-hidden rounded-md">
          <Sparkline data={sparkline} positive={positive} />
        </div>
      </div>
    </Link>
  );
}