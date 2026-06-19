import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PricePoint } from "@/lib/prices.server";
import type { Currency } from "@/lib/commodities";
import { convertPrice, formatPrice } from "@/lib/format";

export function PriceChart({
  data,
  positive,
  currency = "USD",
}: {
  data: PricePoint[];
  positive: boolean;
  currency?: Currency;
}) {
  const series = data.map((p) => ({
    t: p.t * 1000,
    price: convertPrice(p.c, currency),
    raw: p.c,
  }));
  const stroke = positive ? "var(--positive)" : "var(--negative)";
  return (
    <div className="relative h-64 w-full min-w-0 overflow-hidden rounded-2xl border border-border bg-card p-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="pc-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="t"
            tickFormatter={(t) => {
              const d = new Date(t);
              return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
            }}
            stroke="var(--muted-foreground)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            minTickGap={40}
            padding={{ left: 8, right: 8 }}
          />
          <YAxis
            domain={["auto", "auto"]}
            stroke="var(--muted-foreground)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(v) => (v >= 1000 ? v.toFixed(0) : v.toFixed(2))}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(t) => new Date(t as number).toLocaleString()}
            formatter={(_v, _n, item) => [formatPrice(item.payload.raw, currency), "Price"]}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={stroke}
            strokeWidth={2}
            fill="url(#pc-grad)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}