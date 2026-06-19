import { COMMODITIES, type Commodity } from "./commodities";
import { STOCKS, type Stock } from "./stocks";

export type AssetKind = "commodity" | "stock";
export type Asset = (Commodity | Stock) & { kind: AssetKind };

function tag<T extends { category: string }>(arr: T[], kind: AssetKind): Asset[] {
  return arr.map((a) => ({ ...(a as any), kind })) as Asset[];
}

export const ALL_ASSETS: Asset[] = [
  ...tag(COMMODITIES, "commodity"),
  ...tag(STOCKS, "stock"),
];

export function getAsset(id: string): Asset | undefined {
  return ALL_ASSETS.find((a) => a.id === id);
}

export function assetsByKind(kind: AssetKind): Asset[] {
  return ALL_ASSETS.filter((a) => a.kind === kind);
}