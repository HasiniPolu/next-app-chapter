import { CURRENCY_SYMBOLS, FX_RATES, type Currency } from "./commodities";

export function convertPrice(usdPrice: number, currency: Currency): number {
  return usdPrice * FX_RATES[currency];
}

export function formatPrice(usdPrice: number, currency: Currency = "USD"): string {
  const value = convertPrice(usdPrice, currency);
  const decimals = value < 10 ? 3 : value < 1000 ? 2 : 2;
  return `${CURRENCY_SYMBOLS[currency]}${value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatChange(pct: number): string {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export function changeColor(pct: number): string {
  if (pct > 0) return "text-positive";
  if (pct < 0) return "text-negative";
  return "text-muted-foreground";
}