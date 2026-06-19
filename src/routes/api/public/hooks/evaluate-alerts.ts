import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/evaluate-alerts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // The Supabase anon/publishable key is required (matches pg_cron header).
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        const apikey = request.headers.get("apikey");
        if (!expected || apikey !== expected) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { fetchAllSpotPrices } = await import("@/lib/prices.server");

        const snaps = await fetchAllSpotPrices();
        const priceById = new Map(snaps.map((s) => [s.commodity_id, s]));

        const { data: alerts, error } = await supabaseAdmin
          .from("alerts")
          .select("*")
          .eq("active", true)
          .is("triggered_at", null);
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        let triggered = 0;
        for (const a of alerts ?? []) {
          const snap = priceById.get(a.asset_id);
          if (!snap) continue;
          const threshold = Number(a.threshold);
          let hit = false;
          if (a.condition === "above" && snap.price >= threshold) hit = true;
          else if (a.condition === "below" && snap.price <= threshold) hit = true;
          else if (a.condition === "pct_change" && Math.abs(snap.change_pct) >= threshold) hit = true;
          if (hit) {
            await supabaseAdmin
              .from("alerts")
              .update({
                triggered_at: new Date().toISOString(),
                triggered_price: snap.price,
              })
              .eq("id", a.id);
            triggered++;
          }
        }

        return new Response(
          JSON.stringify({ ok: true, evaluated: alerts?.length ?? 0, triggered }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});