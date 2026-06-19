import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Condition = z.enum(["above", "below", "pct_change"]);
const Kind = z.enum(["commodity", "stock"]);

export const listAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("alerts")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const createAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        asset_id: z.string().min(1).max(50),
        asset_kind: Kind.default("commodity"),
        condition: Condition,
        threshold: z.number().finite(),
        currency: z.string().default("USD"),
        note: z.string().max(140).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("plan")
      .eq("id", context.userId)
      .maybeSingle();
    if (profile?.plan !== "premium") {
      const { count } = await context.supabase
        .from("alerts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", context.userId)
        .eq("active", true);
      if ((count ?? 0) >= 3) {
        throw new Error("Free plan limited to 3 active alerts. Upgrade to Premium for unlimited.");
      }
    }
    const { data: row, error } = await context.supabase
      .from("alerts")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const toggleAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("alerts")
      .update({ active: data.active, triggered_at: data.active ? null : undefined })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const deleteAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("alerts")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const evaluateMyAlerts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: alerts, error } = await context.supabase
      .from("alerts")
      .select("*")
      .eq("user_id", context.userId)
      .eq("active", true)
      .is("triggered_at", null);
    if (error) throw error;
    if (!alerts || alerts.length === 0) return { triggered: 0 };

    const { fetchAllSpotPrices } = await import("./prices.server");
    const snaps = await fetchAllSpotPrices();
    const priceById = new Map(snaps.map((s) => [s.commodity_id, s]));

    let triggered = 0;
    for (const a of alerts) {
      const snap = priceById.get(a.asset_id);
      if (!snap) continue;
      const threshold = Number(a.threshold);
      let hit = false;
      if (a.condition === "above" && snap.price >= threshold) hit = true;
      else if (a.condition === "below" && snap.price <= threshold) hit = true;
      else if (a.condition === "pct_change" && Math.abs(snap.change_pct) >= threshold) hit = true;
      if (hit) {
        await context.supabase
          .from("alerts")
          .update({ triggered_at: new Date().toISOString(), triggered_price: snap.price })
          .eq("id", a.id)
          .eq("user_id", context.userId);
        triggered++;
      }
    }
    return { triggered };
  });