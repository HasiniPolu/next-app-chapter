import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getCommodity } from "./commodities";

const HORIZONS = ["24H", "7D", "30D"] as const;
type Horizon = (typeof HORIZONS)[number];

interface ForecastResult {
  predicted_price: number;
  direction: "up" | "down" | "flat";
  confidence: number;
  rationale: string;
  sentiment: "bullish" | "bearish" | "neutral";
}

const FORECAST_TTL_HOURS: Record<Horizon, number> = { "24H": 2, "7D": 6, "30D": 12 };

async function callOpenAI(prompt: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not configured");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a commodity market analyst. Reply ONLY with strict JSON matching the schema requested. Be concise. Predictions are informational, not financial advice.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI ${res.status}: ${txt.slice(0, 200)}`);
  }
  const j = await res.json();
  return j.choices?.[0]?.message?.content ?? "{}";
}

export const getAiForecast = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ id: z.string(), horizon: z.enum(HORIZONS) }).parse(d),
  )
  .handler(async ({ data }) => {
    const c = getCommodity(data.id);
    if (!c) throw new Error("Unknown commodity");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Check cache
    const { data: cached } = await supabaseAdmin
      .from("ai_forecasts")
      .select("*")
      .eq("commodity_id", data.id)
      .eq("horizon", data.horizon)
      .eq("currency", "USD")
      .maybeSingle();

    const ttlMs = FORECAST_TTL_HOURS[data.horizon] * 60 * 60 * 1000;
    if (cached && Date.now() - new Date(cached.generated_at).getTime() < ttlMs) {
      return cached;
    }

    // Get current snapshot for context
    const { fetchSpotPrice } = await import("./prices.server");
    const snap = await fetchSpotPrice(c);

    const prompt = `Generate a ${data.horizon} price forecast for ${c.name} (${c.symbol}).
Current price: $${snap.price.toFixed(2)} per ${c.unit}.
24h change: ${snap.change_pct.toFixed(2)}%.
Today's range: $${snap.low_24h.toFixed(2)} - $${snap.high_24h.toFixed(2)}.

Respond with JSON: {
  "predicted_price": number (USD per ${c.unit}),
  "direction": "up" | "down" | "flat",
  "confidence": number 0-1,
  "rationale": string (2-3 sentences explaining key drivers),
  "sentiment": "bullish" | "bearish" | "neutral"
}`;

    let result: ForecastResult;
    try {
      const raw = await callOpenAI(prompt);
      result = JSON.parse(raw);
    } catch (e) {
      // Fallback heuristic forecast if AI call fails
      const drift = snap.change_pct / 100;
      const horizonMult = data.horizon === "24H" ? 0.4 : data.horizon === "7D" ? 1.5 : 4;
      const predicted = snap.price * (1 + drift * horizonMult);
      result = {
        predicted_price: predicted,
        direction: drift > 0.001 ? "up" : drift < -0.001 ? "down" : "flat",
        confidence: 0.45,
        rationale: `Forecast based on recent ${data.horizon} momentum. AI service unavailable (${(e as Error).message.slice(0, 80)}). This is a heuristic fallback.`,
        sentiment: drift > 0 ? "bullish" : drift < 0 ? "bearish" : "neutral",
      };
    }

    const row = {
      commodity_id: data.id,
      horizon: data.horizon,
      currency: "USD",
      predicted_price: result.predicted_price,
      direction: result.direction,
      confidence: result.confidence,
      rationale: result.rationale,
      sentiment: result.sentiment,
      generated_at: new Date().toISOString(),
    };
    await supabaseAdmin.from("ai_forecasts").upsert(row);
    return row;
  });

export const getMarketDigest = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("display_name")
      .eq("id", context.userId)
      .maybeSingle();
    const name = profile?.display_name?.split(" ")[0] ?? "there";
    const hour = new Date().getUTCHours();
    const greeting = hour < 11 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    return {
      greeting: `${greeting}, ${name}`,
      digest: "Here's your market snapshot. Live commodity prices, AI forecasts, and your watchlist — all in one place.",
    };
  });