## Goals

1. Stop chart lines from rendering outside the card on the commodity detail page.
2. Replace the "Coming soon" News and Trends screens with real content.
3. Make prices feel live, like a 24/7 market ticker.
4. Add a Price Alerts feature.
5. Add Stocks alongside commodities.

## 1. Chart overflow fix

Symptom: on the Commodity Detail page the Area chart line draws past the rounded card edge at tablet width.

Fix in `src/components/PriceChart.tsx`:
- Wrap the `ResponsiveContainer` in a parent with `overflow-hidden rounded-2xl border bg-card p-3`.
- Set `AreaChart` margin to `{ top: 8, right: 8, left: 8, bottom: 0 }` and give `YAxis` `width={44}` so ticks don't push the plot area.
- Force `<ResponsiveContainer width="100%" height={256}>` inside a `min-w-0` flex parent so it can't expand past the card.

In `src/routes/_authenticated/commodity.$id.tsx`, drop the bare chart section and wrap it in a `min-w-0` container so the chart inherits the mobile column width correctly.

## 2. News page (`src/routes/_authenticated/news.tsx`)

Build a real news feed:
- Add `src/lib/news.ts` with a curated dataset of ~20 commodity/market headlines: title, source, publishedAt, summary, sentiment (`bullish` | `bearish` | `neutral`), relatedAssetIds, image URL (Unsplash topical), category filter (Metals, Energy, Fuel, Stocks, Macro).
- Render: header with category chips filter, search input, list of `NewsCard` items with sentiment-colored badge, source + relative time, tap-to-expand summary.
- Add a "Top movers" strip at the top sourced from `getMarketOverview` so news links to live prices.

## 3. Trends page (`src/routes/_authenticated/trends.tsx`)

Build a real analytics dashboard:
- Top movers leaderboard (gainers / losers tabs).
- Market sentiment gauge per category (Metals/Energy/Fuel/Stocks) computed from average `change_pct`.
- Multi-asset overlay chart: pick up to 3 assets, plot normalized % change over the selected timeframe.
- 7-day correlation heatmap (small grid, computed from history series).

All data sourced from the existing `prices.functions.ts` + a new `getTrends` server fn that returns aggregated series.

## 4. Live 24/7 price ticking

Goal: prices visibly tick like a real market, even outside exchange hours.

- In `src/lib/prices.server.ts`, change `generateSeries` to seed by `Math.floor(Date.now() / 5000)` (5-second bucket) so each refresh produces a new but smooth point; keep last value continuity by mixing previous seed.
- Add `refetchInterval: 5_000` to dashboard, home, watchlist, and commodity detail queries.
- Add a `<LiveDot />` indicator in headers (pulsing green) + "Live · updated Xs ago" timestamp.
- Animate price changes with a brief green/red flash using a `useFlash(value)` hook (sets a className for 600ms on change).
- Update sparkline + main chart to append the latest tick instead of full-replace so the line slides.

## 5. Price Alerts

Database (new migration):
- `alerts` table: `id`, `user_id`, `asset_id` (text — works for commodities & stocks), `asset_kind` ('commodity'|'stock'), `condition` ('above'|'below'|'pct_change'), `threshold` numeric, `currency`, `active` bool, `triggered_at` timestamptz null, `created_at`, `updated_at`.
- RLS: owner-only ALL via `auth.uid() = user_id`. GRANTs for authenticated + service_role. No anon.

Server functions in `src/lib/alerts.functions.ts`:
- `listAlerts`, `createAlert`, `toggleAlert`, `deleteAlert` — all `requireSupabaseAuth`.
- `evaluateAlerts` (called from a `/api/public/hooks/evaluate-alerts` cron route) — fetches active alerts, current prices, marks `triggered_at` when the condition is satisfied.

UI:
- New `/_authenticated/alerts` route: list of user alerts grouped by Active / Triggered, swipe-to-delete, toggle switch.
- "Create Alert" sheet from commodity/stock detail header (bell icon next to star): asset preselected, condition + threshold inputs with live "currently at X" hint.
- Free plan capped at 3 active alerts; premium unlimited (enforced in `createAlert`).

Cron: `pg_cron` job every 1 minute hitting `/api/public/hooks/evaluate-alerts` with the anon key in `apikey` header. The route verifies the header and calls `evaluateAlerts`.

(Push notifications are out of scope for this pass — alerts surface in the in-app Alerts screen and as a toast on next app open. Wiring web-push can be a follow-up.)

## 6. Stocks

Extend the asset model rather than forking:
- New file `src/lib/stocks.ts` with ~12 popular tickers (AAPL, MSFT, NVDA, GOOGL, AMZN, TSLA, META, JPM, V, XOM, SPY, QQQ): id, name, symbol, exchange, basePrice, category 'stock', icon emoji or letter glyph.
- Generalize `commodities.ts` → introduce `Asset = Commodity | Stock` union with shared `kind` field.
- `prices.server.ts`: add `fetchStockSpotPrice` using the same deterministic ticker engine, expose `fetchAllAssets()` returning both kinds.
- Dashboard gains a "Stocks" tab next to "Commodities".
- Commodity detail route becomes `commodity.$id.tsx` for commodities and a parallel `stock.$id.tsx` (or unified `asset.$kind.$id.tsx`) — pick unified asset route for less duplication: `src/routes/_authenticated/asset.$kind.$id.tsx`, keep `commodity.$id` as a redirect for back-compat.
- Watchlist already keys on `commodity_id` (text) — add nullable `asset_kind` column via a small migration defaulting to `'commodity'` so stocks fit without breaking existing rows.

## 7. Navigation update

Bottom nav: keep 5 slots. Replace "News" with "Alerts" (bell icon) and fold News into the Home screen as a horizontal "Latest news" rail; Trends stays. Final order: Home, Dashboard, Trends, Alerts, Profile. News remains reachable from the Home rail "See all" link to `/news`.

## Technical summary

New / changed files:
- `src/components/PriceChart.tsx` — overflow fix.
- `src/components/LiveDot.tsx`, `src/hooks/useFlash.ts` — live UI helpers.
- `src/lib/news.ts`, `src/routes/_authenticated/news.tsx` — real news feed.
- `src/routes/_authenticated/trends.tsx` — analytics dashboard.
- `src/lib/stocks.ts`, `src/lib/assets.ts` — stocks + unified asset type.
- `src/lib/prices.server.ts`, `src/lib/prices.functions.ts` — 5s ticking + stocks.
- `src/lib/alerts.functions.ts`, `src/routes/_authenticated/alerts.tsx`, `src/components/AlertSheet.tsx`.
- `src/routes/api/public/hooks/evaluate-alerts.ts` — cron endpoint.
- `src/components/BottomNav.tsx` — swap News for Alerts.
- Migrations: create `alerts` table + add `asset_kind` to `watchlist`.
- pg_cron schedule (via insert tool after route ships).

Out of scope for this pass: real third-party price feeds (still simulated), web-push browser notifications, real news API ingestion.
