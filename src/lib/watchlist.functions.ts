import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getWatchlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("watchlist")
      .select("*")
      .eq("user_id", context.userId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

export const addToWatchlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ commodity_id: z.string().min(1).max(50) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    // Premium gate: free users limited to 10
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("plan")
      .eq("id", context.userId)
      .maybeSingle();
    if (profile?.plan !== "premium") {
      const { count } = await context.supabase
        .from("watchlist")
        .select("*", { count: "exact", head: true })
        .eq("user_id", context.userId);
      if ((count ?? 0) >= 10) {
        throw new Error("Free plan limited to 10 watchlist items. Upgrade to Premium for unlimited.");
      }
    }
    const { data: row, error } = await context.supabase
      .from("watchlist")
      .insert({ user_id: context.userId, commodity_id: data.commodity_id })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const removeFromWatchlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ commodity_id: z.string().min(1).max(50) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("watchlist")
      .delete()
      .eq("user_id", context.userId)
      .eq("commodity_id", data.commodity_id);
    if (error) throw error;
    return { ok: true };
  });

export const reorderWatchlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ order: z.array(z.string()).max(200) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await Promise.all(
      data.order.map((cid, idx) =>
        context.supabase
          .from("watchlist")
          .update({ sort_order: idx })
          .eq("user_id", context.userId)
          .eq("commodity_id", cid),
      ),
    );
    return { ok: true };
  });