export type NewsCategory = "metals" | "energy" | "fuel" | "stocks" | "macro";
export type NewsSentiment = "bullish" | "bearish" | "neutral";

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string; // ISO
  category: NewsCategory;
  sentiment: NewsSentiment;
  relatedIds: string[];
}

// Curated dataset — dates are relative to "now" so the UI always feels fresh.
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

export const NEWS: NewsItem[] = [
  {
    id: "n1",
    title: "Gold edges higher as traders await Fed minutes",
    summary:
      "Spot gold ticked up 0.4% in Asian trading as investors positioned for the FOMC minutes due later this week, with safe-haven demand supported by a softer dollar.",
    source: "Reuters",
    publishedAt: minutesAgo(14),
    category: "metals",
    sentiment: "bullish",
    relatedIds: ["gold", "silver"],
  },
  {
    id: "n2",
    title: "Crude slips on demand worries after surprise inventory build",
    summary:
      "WTI crude fell more than 1% after EIA reported a larger-than-expected build in US stockpiles, raising concerns about near-term demand resilience.",
    source: "Bloomberg",
    publishedAt: minutesAgo(38),
    category: "energy",
    sentiment: "bearish",
    relatedIds: ["crude-wti", "crude-brent"],
  },
  {
    id: "n3",
    title: "Nvidia powers Nasdaq to fresh record",
    summary:
      "Nvidia jumped 2.1% on continued AI capex enthusiasm, dragging the Nasdaq 100 to an all-time high. Semiconductor strength offset weakness in energy names.",
    source: "CNBC",
    publishedAt: hoursAgo(1),
    category: "stocks",
    sentiment: "bullish",
    relatedIds: ["nvda", "qqq", "spy"],
  },
  {
    id: "n4",
    title: "Diesel margins compress as refining capacity returns",
    summary:
      "US Gulf Coast diesel cracks narrowed to a three-month low this week as Motiva's Port Arthur unit ramps back to full output.",
    source: "S&P Global",
    publishedAt: hoursAgo(2),
    category: "fuel",
    sentiment: "bearish",
    relatedIds: ["diesel", "crude-wti"],
  },
  {
    id: "n5",
    title: "Silver tracks gold higher; industrial demand seen firm",
    summary:
      "Silver climbed 0.7%, outpacing gold on improved solar-panel demand projections from China's latest 5-year plan addendum.",
    source: "Kitco",
    publishedAt: hoursAgo(3),
    category: "metals",
    sentiment: "bullish",
    relatedIds: ["silver", "gold"],
  },
  {
    id: "n6",
    title: "Apple reportedly accelerates India production shift",
    summary:
      "Apple plans to assemble 25% of iPhones in India by 2027, a faster pace than analysts expected. The stock added 0.6% in pre-market trading.",
    source: "Wall Street Journal",
    publishedAt: hoursAgo(4),
    category: "stocks",
    sentiment: "bullish",
    relatedIds: ["aapl"],
  },
  {
    id: "n7",
    title: "OPEC+ holds output steady; signals caution on H2 demand",
    summary:
      "The cartel kept its current quotas unchanged but flagged downside risks to second-half demand, sending Brent down 0.9%.",
    source: "Financial Times",
    publishedAt: hoursAgo(5),
    category: "energy",
    sentiment: "bearish",
    relatedIds: ["crude-brent", "crude-wti"],
  },
  {
    id: "n8",
    title: "Copper steady as China property stimulus underwhelms",
    summary:
      "LME copper held in a tight range after Beijing's latest property package fell short of trader expectations on size and timing.",
    source: "Reuters",
    publishedAt: hoursAgo(6),
    category: "metals",
    sentiment: "neutral",
    relatedIds: ["copper"],
  },
  {
    id: "n9",
    title: "Natural gas spikes 4% on cooler weather forecast",
    summary:
      "Henry Hub futures surged on revised forecasts showing colder-than-normal temperatures across the US Northeast through next week.",
    source: "Platts",
    publishedAt: hoursAgo(7),
    category: "energy",
    sentiment: "bullish",
    relatedIds: ["natural-gas"],
  },
  {
    id: "n10",
    title: "Dollar index dips ahead of CPI; risk assets bid",
    summary:
      "DXY softened 0.3% as traders trimmed long-dollar positions before tomorrow's inflation print, supporting both metals and equities.",
    source: "Bloomberg",
    publishedAt: hoursAgo(8),
    category: "macro",
    sentiment: "bullish",
    relatedIds: ["gold", "spy", "qqq"],
  },
  {
    id: "n11",
    title: "Tesla deliveries beat low-end estimates",
    summary:
      "Tesla reported quarterly deliveries above the most bearish street forecasts but still down YoY. Shares whipsawed 4% in either direction post-print.",
    source: "CNBC",
    publishedAt: hoursAgo(9),
    category: "stocks",
    sentiment: "neutral",
    relatedIds: ["tsla"],
  },
  {
    id: "n12",
    title: "Platinum group metals rally on supply concerns",
    summary:
      "Platinum and palladium climbed more than 2% after South African producers warned of extended power constraints into Q3.",
    source: "Mining Weekly",
    publishedAt: hoursAgo(11),
    category: "metals",
    sentiment: "bullish",
    relatedIds: ["platinum", "palladium"],
  },
];

export const CATEGORY_LABEL: Record<NewsCategory, string> = {
  metals: "Metals",
  energy: "Energy",
  fuel: "Fuel",
  stocks: "Stocks",
  macro: "Macro",
};

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}