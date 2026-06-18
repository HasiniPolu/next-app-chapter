import { Area, AreaChart, ResponsiveContainer } from "recharts";

export function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const series = data.map((v, i) => ({ i, v }));
  const stroke = positive ? "var(--positive)" : "var(--negative)";
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={series} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id={`sg-${positive ? "p" : "n"}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={stroke}
          strokeWidth={1.6}
          fill={`url(#sg-${positive ? "p" : "n"})`}
          isAnimationActive={false}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}