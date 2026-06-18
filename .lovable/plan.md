
# SentiMarket — MVP Plan

A mobile-first PWA delivering live commodity prices, a personal watchlist, AI-powered insights, and authenticated user accounts. Later iterations will add alerts, news, compare, forecasts hub, and notifications.

## MVP Scope (this build)

In scope:
1. Auth — email/password + Google sign-in, profile basics
2. Onboarding (3 slides, shown once)
3. Home — greeting, watchlist quick view, top movers, AI insight card
4. Dashboard — live commodity grid with sparklines, currency toggle
5. Commodity Detail — interactive chart (1D/1W/1M/3M/6M/1Y), key stats, AI 24H/7D/30D forecast, sentiment, related context
6. Watchlist — add/remove/reorder, synced to backend
7. Profile — avatar, display name, currency, dark/light toggle, logout
8. Pricing — Free vs Premium with working Stripe checkout (built-in)
9. PWA — installable manifest, icons, theme color, standalone display (no offline cache in MVP)
10. Dark/Light mode + fintech design system

Out of scope for MVP (deferred):
- Alerts + push notifications, News feed + bookmarks, Forecasts hub page, Comparison tool, Notifications center, Search screen, Offline service worker, Article in-app browser, Correlation heatmap, Volatility index, Export CSV/PNG

## User Decisions Confirmed

- Approach: MVP first
- Prices: User provides API keys (Metals API + a commodities/oil API)
- AI: OpenAI GPT-4o (user provides `OPENAI_API_KEY`)
- Payments: Lovable's built-in Stripe (requires Pro plan)

## Design Direction

Fintech aesthetic inspired by Robinhood / CoinGecko, mobile-first (375–430px).

- Palette (semantic tokens in `src/styles.css`):
  - Primary `#3B5BDB` (Electric Blue), Primary-deep `#1A1F5E`
  - Bg dark `#0F1117`, Surface dark `#1C1F26`, Border `#2E3247`
  - Bg light `#F8F9FC`, Text light `#1A1A2E`
  - Positive `#00C48C`, Negative `#FF4757`, Neutral amber `#FFA502`
- Typography: Inter (UI) + JetBrains Mono (prices/numbers), via `@fontsource`
- Card radius 12px, 1px subtle borders, glass-morphism in dark mode
- Skeleton loaders (no spinners), price flash animation on tick (Framer Motion)
- Bottom nav (5 tabs): Home / Dashboard / Trends* / News* / Profile  
  *Trends and News tabs render "Coming soon" placeholder in MVP

## Architecture & Tech Stack (this environment)

| Concern | Implementation |
|---|---|
| Framework | TanStack Start (React 19) + Vite |
| Styling | Tailwind v4 + CSS tokens in `src/styles.css` |
| Charts | `recharts` (line + area + sparkline) |
| Animation | `framer-motion` |
| Backend | Lovable Cloud (Supabase under the hood) |
| Auth | Lovable Cloud Auth (email/password + Google) |
| DB | Postgres with RLS |
| Server logic | TanStack `createServerFn` |
| AI | OpenAI GPT-4o via server function (key in `OPENAI_API_KEY`) |
| Prices | External APIs called from server functions, cached in DB |
| Payments | Built-in Stripe (`enable_stripe_payments`) |
| PWA | Manifest-only installability (no service worker) |

## Backend (Lovable Cloud)

Will enable Lovable Cloud, then create:

Tables (all with RLS + grants):
- `profiles` — id (FK auth.users), display_name, avatar_url, currency, theme, plan (free/premium), created_at
- `watchlist` — id, user_id, commodity_id, sort_order, created_at
- `price_snapshots` — commodity_id, currency, price, change_pct, timestamp (server-cached price cache, anon-readable)
- `price_history` — commodity_id, timeframe, ohlc data (jsonb), fetched_at (server cache)
- `ai_forecasts` — commodity_id, horizon (24h/7d/30d), predicted_price, direction, confidence, rationale, generated_at (cached, TTL ~6h)

Triggers: auto-create `profiles` row on signup.

Server functions (`src/lib/*.functions.ts`):
- `getCommodities` — public list with latest cached prices
- `getCommodityDetail({id, timeframe, currency})` — price + history, cached
- `getWatchlist` / `addToWatchlist` / `removeFromWatchlist` / `reorderWatchlist` (auth)
- `getAiForecast({id})` — checks cache; if stale, calls OpenAI GPT-4o, persists
- `getAiMarketDigest()` — daily greeting blurb, cached per-user-per-day
- `createCheckoutSession` / `getSubscriptionStatus` (Stripe)

Stripe webhook route at `src/routes/api/public/stripe-webhook.ts` (signature verified) updates `profiles.plan`.

## Screens & Routes

Public:
- `/` — onboarding (3 slides) + auto-redirect if signed in
- `/auth` — login + signup tabs + Google button + forgot password
- `/reset-password` — set new password

Authenticated (`/_authenticated/`):
- `/home` — greeting, watchlist scroller, top movers, featured grid, AI insight card
- `/dashboard` — full commodity grid + currency selector + pull-to-refresh
- `/commodity/$id` — header, price block, chart with timeframe tabs, stats, AI forecast section (premium-gated for 7D/30D), watchlist toggle
- `/watchlist` — manageable list, drag reorder
- `/profile` — avatar, name, currency, theme toggle, plan badge, logout
- `/pricing` — Free vs Premium, monthly/annual toggle, Stripe checkout
- `/trends`, `/news` — placeholder "Coming soon" screens to keep bottom-nav slots

## Premium Gating

- Free: 24H forecast only, watchlist up to 10 items
- Premium: 24H/7D/30D forecasts, unlimited watchlist
- Gating evaluated server-side via `profiles.plan`; UI shows blurred locked sections with "Upgrade" CTA → `/pricing`

## PWA Setup

Manifest-only (per platform guidance — no SW unless user requests offline):
- `public/manifest.webmanifest` with name, short_name, theme_color `#1A1F5E`, bg_color `#0F1117`, display `standalone`, icons 192/512
- App icons generated via image gen
- `<link rel="manifest">`, `theme-color`, `apple-touch-icon` in `__root.tsx` head

## Secrets Needed From You

Before/during build I'll request:
1. `OPENAI_API_KEY` — for GPT-4o forecasts/sentiment
2. `METALS_API_KEY` (or `GOLDAPI_KEY`) — gold/silver
3. `COMMODITIES_API_KEY` (Alpha Vantage or commodities-api) — oil/petrol/diesel/LPG/etc.

Stripe is handled by the built-in integration (no key paste).

## Build Order

1. Enable Lovable Cloud → create schema, RLS, profile trigger
2. Add OpenAI + commodity API keys as secrets
3. Design system tokens + fonts + bottom nav shell
4. Auth (`/auth`, `/reset-password`) + `_authenticated` gate
5. Onboarding `/` flow
6. Server functions for prices (with DB cache + fallback mock if API fails)
7. Dashboard + Commodity Detail with charts
8. Watchlist + Home assembly
9. AI forecast server function + Commodity Detail integration
10. Profile + dark/light persistence
11. Enable Stripe → products → Pricing page + webhook + plan gating
12. PWA manifest + icons
13. Polish: skeletons, price-flash animation, error/empty states

## Notes / Risks

- Commodity APIs differ in symbol coverage; I'll abstract behind a single server-side `pricesProvider` so swapping providers is one file.
- GPT-4o forecast is informational; I'll include a disclaimer on `/commodity/$id`.
- Stripe requires Pro plan and Lovable Cloud enabled — if Pro isn't active I'll stop and ask before enabling.
- Trends/News/Alerts/Compare/Forecasts hub/Notifications/Search/offline are explicitly deferred — confirm that's acceptable.

Approve to proceed, or tell me what to adjust (scope, deferred features, gating thresholds, palette).
