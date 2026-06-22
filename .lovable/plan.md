Elevate the app to a polished, institutional-grade markets product — think Bloomberg Terminal meets Linear. Tighter type, calmer surfaces, sharper data hierarchy. No functional changes; visual layer only.

## Design direction (locked)
- **Palette**: Navy Trust + warm gold accent. Base `#0a1224` background, `#0f1b3d` surfaces, `#1e3a5f` borders, `#e8edf3` foreground, gold `#c9a84c` reserved for KPIs/CTAs, plus existing positive/negative greens & reds (slightly desaturated).
- **Typography**: `Instrument Serif` for display/headings, `Work Sans` for UI, `JetBrains Mono` for all numeric data (prices, %, timestamps). Loaded via `<link>` in `__root.tsx`.
- **Radii & spacing**: tighten to `--radius: 14px` (cards), `10px` (buttons), generous 16/24 grid. Hairline 1px borders, soft inner glow on hover instead of color flips.
- **Shadows**: subtle layered shadow tokens (`--shadow-card`, `--shadow-elevated`) — no heavy drops.

## Files touched (presentation only)
1. `src/styles.css` — replace color tokens with Navy Trust ramp (oklch), add `--font-display`, `--font-sans`, `--font-mono`, register `@theme inline`, add shadow + gradient tokens, refine scrollbar hiding.
2. `src/routes/__root.tsx` — add Google Fonts `<link>` for Instrument Serif, Work Sans, JetBrains Mono.
3. `src/components/CommodityCard.tsx` — restructured: monospace price, serif name, gold micro-label for kind, top-right delta chip with tinted bg, subtle gradient border on hover.
4. `src/components/BottomNav.tsx` — taller bar, refined active pill (gold underline + soft glow), Work Sans labels.
5. `src/routes/_authenticated/home.tsx` — editorial header ("Markets" serif + date kicker), KPI strip (Top gainer / Top loser / Market breadth), tighter section headers (uppercase tracking), refined movers list (mono right-aligned columns, divider lines).
6. `src/routes/_authenticated/dashboard.tsx` — bento layout: hero featured asset (large), 2×2 KPI tiles, watchlist column.
7. `src/routes/_authenticated/commodity.$id.tsx` — header card with serif title + mono price + delta chip, timeframe pill group restyled, forecast cards with gold confidence bar.
8. `src/routes/_authenticated/trends.tsx`, `news.tsx`, `alerts.tsx`, `watchlist.tsx`, `pricing.tsx`, `profile.tsx` — header treatment + card chrome aligned with new system (no layout rewrites).
9. `src/components/ui/button.tsx` — add `premium` variant (gold gradient + subtle shadow); keep existing variants intact.
10. `src/components/PriceChart.tsx` — restyle grid/axis colors to new tokens, gold tooltip border, no behavior change.

## What stays the same
- All routes, data flows, server functions, alerts logic, auth.
- Sparklines remain removed (per previous turns).
- Chart libraries, breakpoints, mobile-first shell.

## Out of scope
- Backend, schema, copy rewrites beyond headers/labels.
- New pages or features.
- Light theme overhaul (kept usable but tuned to the same palette).
