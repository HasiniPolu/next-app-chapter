export type CommodityCategory = "metal" | "energy" | "fuel" | "agri";

export interface Commodity {
  id: string;
  name: string;
  symbol: string;
  unit: string;
  category: CommodityCategory;
  icon: string; // emoji fallback
  basePrice: number; // USD reference for mock generation
  exchange?: string;
}

export const COMMODITIES: Commodity[] = [
  { id: "gold", name: "Gold", symbol: "XAU", unit: "oz", category: "metal", icon: "🥇", basePrice: 2645.5, exchange: "COMEX" },
  { id: "silver", name: "Silver", symbol: "XAG", unit: "oz", category: "metal", icon: "🥈", basePrice: 31.2, exchange: "COMEX" },
  { id: "platinum", name: "Platinum", symbol: "XPT", unit: "oz", category: "metal", icon: "⚪", basePrice: 985.4, exchange: "NYMEX" },
  { id: "palladium", name: "Palladium", symbol: "XPD", unit: "oz", category: "metal", icon: "⚫", basePrice: 1024.0, exchange: "NYMEX" },
  { id: "copper", name: "Copper", symbol: "HG", unit: "lb", category: "metal", icon: "🟠", basePrice: 4.32, exchange: "COMEX" },
  { id: "crude-wti", name: "Crude Oil (WTI)", symbol: "CL", unit: "bbl", category: "energy", icon: "🛢️", basePrice: 78.4, exchange: "NYMEX" },
  { id: "crude-brent", name: "Crude Oil (Brent)", symbol: "BZ", unit: "bbl", category: "energy", icon: "🛢️", basePrice: 82.1, exchange: "ICE" },
  { id: "natural-gas", name: "Natural Gas", symbol: "NG", unit: "MMBtu", category: "energy", icon: "🔥", basePrice: 3.15, exchange: "NYMEX" },
  { id: "petrol", name: "Petrol (Gasoline)", symbol: "RB", unit: "gal", category: "fuel", icon: "⛽", basePrice: 2.41, exchange: "NYMEX" },
  { id: "diesel", name: "Diesel", symbol: "HO", unit: "gal", category: "fuel", icon: "🚚", basePrice: 2.52, exchange: "NYMEX" },
  { id: "lpg", name: "LPG (Propane)", symbol: "PG", unit: "gal", category: "fuel", icon: "🟢", basePrice: 0.82, exchange: "NYMEX" },
  { id: "aluminum", name: "Aluminum", symbol: "ALI", unit: "t", category: "metal", icon: "🔘", basePrice: 2540.0, exchange: "LME" },
];

export function getCommodity(id: string): Commodity | undefined {
  return COMMODITIES.find((c) => c.id === id);
}

export const FEATURED_IDS = ["gold", "silver", "crude-wti", "petrol", "diesel", "lpg"];

export type Currency = "USD" | "INR" | "EUR" | "GBP";
export const CURRENCIES: Currency[] = ["USD", "INR", "EUR", "GBP"];

// Static FX rates (USD -> X). Real app would fetch live rates.
export const FX_RATES: Record<Currency, number> = {
  USD: 1,
  INR: 83.4,
  EUR: 0.92,
  GBP: 0.79,
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
};

export type Timeframe = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y";
export const TIMEFRAMES: Timeframe[] = ["1D", "1W", "1M", "3M", "6M", "1Y"];

export const TIMEFRAME_POINTS: Record<Timeframe, number> = {
  "1D": 24,
  "1W": 7 * 6,
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 260,
};