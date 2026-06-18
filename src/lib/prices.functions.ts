import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { COMMODITIES, getCommodity, type Timeframe } from "./commodities";

const TF = z.enum(["1D", "1W", "1M", "3M", "6M", "1Y"]);

export const getAllPrices = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchAllSpotPrices } = await import("./prices.server");
  const snaps = await fetchAllSpotPrices();
  return {
    commodities: COMMODITIES,
    snapshots: snaps,
    fetched_at: new Date().toISOString(),
  };
});

export const getCommodityDetail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ id: z.string(), timeframe: TF.default("1M") }).parse(d),
  )
  .handler(async ({ data }) => {
    const c = getCommodity(data.id);
    if (!c) throw new Error("Unknown commodity");
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
    gainers: sorted.slice(0, 3),
    losers: sorted.slice(-3).reverse(),
  };
});