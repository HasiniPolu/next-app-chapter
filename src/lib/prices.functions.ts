import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { type Timeframe } from "./commodities";
import { ALL_ASSETS, getAsset } from "./assets";

const TF = z.enum(["1D", "1W", "1M", "3M", "6M", "1Y"]);

export const getAllPrices = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchAllSpotPrices } = await import("./prices.server");
  const snaps = await fetchAllSpotPrices();
  return {
    commodities: ALL_ASSETS,
    assets: ALL_ASSETS,
    snapshots: snaps,
    fetched_at: new Date().toISOString(),
  };
});

export const getCommodityDetail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ id: z.string(), timeframe: TF.default("1M") }).parse(d),
  )
  .handler(async ({ data }) => {
    const c = getAsset(data.id);
    if (!c) throw new Error("Unknown asset");
    const { fetchSpotPrice, fetchHistory } = await import("./prices.server");
    const [snap, history] = await Promise.all([
      fetchSpotPrice(c),
      fetchHistory(c, data.timeframe as Timeframe),
    ]);
    return { commodity: c, snapshot: snap, history };
  });

export const getTopMovers = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchAllSpotPrices } = await import("./prices.server");
  const snaps = await fetchAllSpotPrices();
  const sorted = [...snaps].sort((a, b) => b.change_pct - a.change_pct);
  return {
    gainers: sorted.slice(0, 5),
    losers: sorted.slice(-5).reverse(),
  };
});

export const getTrends = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ ids: z.array(z.string()).min(1).max(5), timeframe: TF.default("1M") }).parse(d),
  )
  .handler(async ({ data }) => {
    const { fetchHistory } = await import("./prices.server");
    const assets = data.ids.map(getAsset).filter(Boolean) as ReturnType<typeof getAsset>[];
    const series = await Promise.all(
      assets.map(async (a) => {
        const h = await fetchHistory(a!, data.timeframe as Timeframe);
        const base = h[0]?.c ?? 1;
        return {
          id: a!.id,
          name: a!.name,
          points: h.map((p) => ({ t: p.t * 1000, pct: ((p.c - base) / base) * 100, price: p.c })),
        };
      }),
    );
    return { series };
  });