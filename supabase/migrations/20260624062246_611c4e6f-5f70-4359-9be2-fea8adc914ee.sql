
-- watchlist
CREATE TABLE public.watchlist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  commodity_id text NOT NULL,
  asset_kind text NOT NULL DEFAULT 'commodity' CHECK (asset_kind IN ('commodity','stock')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, commodity_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watchlist TO authenticated;
GRANT ALL ON public.watchlist TO service_role;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own watchlist" ON public.watchlist FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- alerts
CREATE TABLE public.alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id text NOT NULL,
  asset_kind text NOT NULL DEFAULT 'commodity' CHECK (asset_kind IN ('commodity','stock')),
  condition text NOT NULL CHECK (condition IN ('above','below','pct_change')),
  threshold numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  active boolean NOT NULL DEFAULT true,
  triggered_at timestamptz NULL,
  triggered_price numeric NULL,
  note text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own alerts" ON public.alerts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER alerts_touch_updated_at BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX alerts_user_active_idx ON public.alerts(user_id, active);

-- ai_forecasts (cache, server-managed)
CREATE TABLE public.ai_forecasts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commodity_id text NOT NULL,
  horizon text NOT NULL CHECK (horizon IN ('24H','7D','30D')),
  currency text NOT NULL DEFAULT 'USD',
  predicted_price numeric NOT NULL,
  direction text NOT NULL CHECK (direction IN ('up','down','flat')),
  confidence numeric NOT NULL,
  rationale text NOT NULL,
  sentiment text NOT NULL CHECK (sentiment IN ('bullish','bearish','neutral')),
  generated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (commodity_id, horizon, currency)
);
GRANT SELECT ON public.ai_forecasts TO authenticated;
GRANT ALL ON public.ai_forecasts TO service_role;
ALTER TABLE public.ai_forecasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read forecasts" ON public.ai_forecasts FOR SELECT TO authenticated USING (true);
