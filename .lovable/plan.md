## Backend status

Verified live: the database is connected and responding. The `alerts`, `profiles`, `watchlist`, `price_snapshots`, `price_history`, and `ai_forecasts` tables exist with the correct RLS policies. The alerts table is currently empty (no one has created one yet), which is why the alerts page looks bare — not a backend failure. I'll confirm again after the fixes by creating a test alert.

## 1. Make the Alerts page complete

Today `/alerts` only lists existing alerts and points users back to an asset to create one. I'll make it self-sufficient:

- **"+ New alert" button in the header** that opens the existing `AlertSheet` with an in-sheet **asset picker** (searchable list of all commodities + stocks, grouped by kind, showing current live price). Selecting an asset prefills the threshold with that asset's current price, same as today.
- **Empty state** gets a primary "Create your first alert" button (opens the same sheet) instead of only a "Browse assets" link.
- **Row interactions**: tapping a row still opens the asset detail; pause/resume and delete stay as icon buttons. Add an **Edit** action (pencil icon) that reopens the sheet pre-filled to update condition/threshold (new `updateAlert` server fn).
- **Triggered alerts** get a "Re-arm" button that flips `triggered_at` back to null and `active` to true (reuses `toggleAlert` + a small new server fn `rearmAlert`).
- Keep the existing 15s in-page evaluation poll; surface a toast when a new alert triggers while the page is open.
- Free-plan limit message ("3/3 used — upgrade for unlimited") shown above the list when the cap is hit, with a link to `/pricing`.

## 2. Fix charts/sparklines bleeding out of their card

Cause: `ResponsiveContainer` from recharts renders the SVG slightly outside the parent because the area stroke has width and the parent has rounded corners but no `overflow-hidden`. Visible at the top edge of cards (your first screenshot).

- `CommodityCard`: wrap the sparkline div in `overflow-hidden rounded-md` and reduce sparkline `strokeWidth` to 1.4. Add a 1px top inset.
- `Sparkline`: change `margin` to `{ top: 3, right: 1, left: 1, bottom: 3 }` so the stroke never touches the edge.
- `PriceChart`: already has `overflow-hidden`, but tighten `AreaChart` margin to `{ top: 10, right: 12, left: 0, bottom: 0 }` and add `overflow-hidden` to the inner ResponsiveContainer wrapper so the dark stroke can't poke above the card border.

## 3. Remove the white horizontal + vertical scrollbars

Cause: horizontal scrollers (`-mx-4 px-4 overflow-x-auto`) on Home/Dashboard let the page itself scroll horizontally on narrow widths, which makes the browser show a body-level horizontal scrollbar (your second screenshot). The vertical bar is the default chrome scrollbar showing because content is tall.

- Add `overflow-x: hidden` to `html, body` in `src/styles.css` so only intended inner rails scroll horizontally.
- Style the WebKit/Firefox scrollbars to be slim and themed (or hidden) globally:
  - `::-webkit-scrollbar { width: 0; height: 0; }` + `scrollbar-width: none` on `html, body` (hide page-level chrome scrollbars).
  - Keep inner horizontal rails scrollable via touch/trackpad (they already use `overflow-x-auto` and don't need visible bars on mobile).
- Verify on the 390px preview viewport that no scrollbar chrome shows.

## Files touched

```
src/routes/_authenticated/alerts.tsx     # picker, empty state, edit, rearm, toast
src/components/AlertSheet.tsx            # optional asset prop → picker mode + edit mode
src/components/AssetPicker.tsx           # NEW — searchable list grouped by kind
src/lib/alerts.functions.ts              # add updateAlert, rearmAlert
src/components/CommodityCard.tsx         # overflow-hidden on sparkline wrapper
src/components/Sparkline.tsx             # safer margins + strokeWidth
src/components/PriceChart.tsx            # tightened margins, inner overflow-hidden
src/styles.css                           # hide page-level scrollbars, overflow-x:hidden
```

## Out of scope

Push notifications, SMS/email delivery, real third-party price feeds.
