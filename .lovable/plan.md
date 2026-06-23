Remove the small sparkline chart from `CommodityCard` so the home/dashboard list shows only the icon, name, symbol, price, and % change. The full `PriceChart` on the commodity detail page (`/commodity/$id`) stays untouched, so tapping a card still opens the chart view.

## Changes

**`src/components/CommodityCard.tsx`**
- Remove the `Sparkline` import and the `<div className="h-12 w-20 ...">` wrapper that renders it.
- Keep the price + change block; drop the now-unused right column so the row is just price/change aligned left.

No other files change. Detail page graph, trends overlay, and top-movers sparklines remain as-is (user only flagged the card thumbnails).

## Out of scope
- Trends page comparison chart
- Top-movers mini sparklines on the Trends page
- Detail page `PriceChart`
