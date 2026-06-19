export interface Stock {
  id: string;
  name: string;
  symbol: string;
  unit: string;
  category: "stock";
  icon: string;
  basePrice: number;
  exchange: string;
}

export const STOCKS: Stock[] = [
  { id: "aapl", name: "Apple", symbol: "AAPL", unit: "share", category: "stock", icon: "", basePrice: 224.5, exchange: "NASDAQ" },
  { id: "msft", name: "Microsoft", symbol: "MSFT", unit: "share", category: "stock", icon: "", basePrice: 438.2, exchange: "NASDAQ" },
  { id: "nvda", name: "NVIDIA", symbol: "NVDA", unit: "share", category: "stock", icon: "", basePrice: 142.7, exchange: "NASDAQ" },
  { id: "googl", name: "Alphabet", symbol: "GOOGL", unit: "share", category: "stock", icon: "", basePrice: 178.3, exchange: "NASDAQ" },
  { id: "amzn", name: "Amazon", symbol: "AMZN", unit: "share", category: "stock", icon: "", basePrice: 198.6, exchange: "NASDAQ" },
  { id: "tsla", name: "Tesla", symbol: "TSLA", unit: "share", category: "stock", icon: "", basePrice: 248.1, exchange: "NASDAQ" },
  { id: "meta", name: "Meta Platforms", symbol: "META", unit: "share", category: "stock", icon: "", basePrice: 562.4, exchange: "NASDAQ" },
  { id: "jpm", name: "JPMorgan Chase", symbol: "JPM", unit: "share", category: "stock", icon: "", basePrice: 223.9, exchange: "NYSE" },
  { id: "v", name: "Visa", symbol: "V", unit: "share", category: "stock", icon: "", basePrice: 304.2, exchange: "NYSE" },
  { id: "xom", name: "Exxon Mobil", symbol: "XOM", unit: "share", category: "stock", icon: "", basePrice: 117.5, exchange: "NYSE" },
  { id: "spy", name: "S&P 500 ETF", symbol: "SPY", unit: "share", category: "stock", icon: "", basePrice: 588.4, exchange: "NYSE" },
  { id: "qqq", name: "Nasdaq 100 ETF", symbol: "QQQ", unit: "share", category: "stock", icon: "", basePrice: 502.6, exchange: "NASDAQ" },
];