import { ALL_ASSETS, type Asset } from "./assets";
import { type Timeframe, TIMEFRAME_POINTS } from "./commodities";

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
  kind?: "commodity" | "stock";
}

export interface PricePoint {
  t: number; // unix seconds
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

/**
 * Build a continuous random-walk price series anchored at the current 5-second
 * tick. The seed is the asset id only, so each refresh extends the walk —
 * giving a live, 24/7 ticker feel even without a real market feed.
 */
function generateSeries(c: Asset, points: number, stepSec?: number): PricePoint[] {
  const vol = c.basePrice * (c.kind === "stock" ? 0.008 : 0.012);
  const out: PricePoint[] = [];
  const now = Math.floor(Date.now() / 1000);
  const step = stepSec ?? Math.max(60, Math.floor((86400 * 365) / Math.max(60, points)));
  // Start from a per-asset deterministic baseline, then walk forward with
  // time-bucketed randomness so each call yields a new but continuous series.
  const baseRand = mulberry32(hashStr(c.id));
  let price = c.basePrice * (0.95 + baseRand() * 0.1);
  for (let i = 0; i < points; i++) {
    const t = now - (points - 1 - i) * step;
    const bucket = Math.floor(t / Math.max(5, step));
    const rand = mulberry32(hashStr(`${c.id}-${bucket}`));
    const drift = (rand() - 0.5) * vol;
    const o = price;
    const c2 = Math.max(0.01, price + drift);
    const h = Math.max(o, c2) + rand() * vol * 0.6;
    const l = Math.min(o, c2) - rand() * vol * 0.6;
    price = c2;
    out.push({ t, o, h, l, c: c2, v: Math.floor(rand() * 100000) });
  }
  return out;
}

export async function fetchSpotPrice(c: Asset): Promise<PriceSnapshot> {
  // 24 1-hour buckets for the rolling 24h window (sparkline).
  const series = generateSeries(c, 24, 3600);
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
    kind: c.kind,
  };
}

export async function fetchAllSpotPrices(): Promise<PriceSnapshot[]> {
  return Promise.all(ALL_ASSETS.map(fetchSpotPrice));
}

export async function fetchHistory(c: Asset, tf: Timeframe): Promise<PricePoint[]> {
  const points = TIMEFRAME_POINTS[tf];
  const stepSec =
    tf === "1D" ? 3600 :
    tf === "1W" ? 4 * 3600 :
    tf === "1M" ? 86400 :
    tf === "3M" ? 86400 :
    tf === "6M" ? 86400 :
    /* 1Y */     86400;
  return generateSeries(c, points, stepSec);
}