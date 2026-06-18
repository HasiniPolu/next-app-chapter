import { COMMODITIES, type Commodity, type Timeframe, TIMEFRAME_POINTS } from "./commodities";

/**
 * Server-side price provider.
 *
 * MVP uses deterministic, time-seeded simulation so the UI is always populated.
 * Swap `fetchSpotPrice` to call your real provider (Metals API, Alpha Vantage,
 * commodities-api, etc.) using process.env.METALS_API_KEY / COMMODITIES_API_KEY.
 */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface PriceSnapshot {
  commodity_id: string;
  price: number; // USD
  change_abs: number;
  change_pct: number;
  high_24h: number;
  low_24h: number;
  sparkline: number[];
  fetched_at: string;
}

export interface PricePoint {
  t: number; // unix seconds
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

function generateSeries(c: Commodity, points: number, dayOffset = 0): PricePoint[] {
  const seedKey = `${c.id}-${Math.floor(Date.now() / (1000 * 60 * 60 * 24)) + dayOffset}`;
  const rand = mulberry32(hashStr(seedKey));
  const vol = c.basePrice * 0.012;
  const out: PricePoint[] = [];
  let price = c.basePrice * (0.95 + rand() * 0.1);
  const now = Math.floor(Date.now() / 1000);
  const stepSec = Math.max(60, Math.floor((86400 * 365) / 260));
  for (let i = 0; i < points; i++) {
    const drift = (rand() - 0.5) * vol;
    const o = price;
    const c2 = Math.max(0.01, price + drift);
    const h = Math.max(o, c2) + rand() * vol * 0.6;
    const l = Math.min(o, c2) - rand() * vol * 0.6;
    price = c2;
    out.push({
      t: now - (points - i) * stepSec,
      o,
      h,
      l,
      c: c2,
      v: Math.floor(rand() * 100000),
    });
  }
  return out;
}

export async function fetchSpotPrice(c: Commodity): Promise<PriceSnapshot> {
  // Real-provider hook: replace this block with your live API call.
  // Example (gold-api.com, no key):
  // if (c.symbol === "XAU" || c.symbol === "XAG") {
  //   const r = await fetch(`https://api.gold-api.com/price/${c.symbol}`);
  //   const j = await r.json();
  //   ...
  // }
  const series = generateSeries(c, 24);
  const last = series[series.length - 1].c;
  const first = series[0].c;
  const change_abs = last - first;
  const change_pct = (change_abs / first) * 100;
  const highs = series.map((p) => p.h);
  const lows = series.map((p) => p.l);
  return {
    commodity_id: c.id,
    price: last,
    change_abs,
    change_pct,
    high_24h: Math.max(...highs),
    low_24h: Math.min(...lows),
    sparkline: series.map((p) => p.c),
    fetched_at: new Date().toISOString(),
  };
}

export async function fetchAllSpotPrices(): Promise<PriceSnapshot[]> {
  return Promise.all(COMMODITIES.map(fetchSpotPrice));
}

export async function fetchHistory(c: Commodity, tf: Timeframe): Promise<PricePoint[]> {
  const points = TIMEFRAME_POINTS[tf];
  return generateSeries(c, points);
}