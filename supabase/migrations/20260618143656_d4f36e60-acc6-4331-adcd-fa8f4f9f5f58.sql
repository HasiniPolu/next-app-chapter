
-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  theme TEXT NOT NULL DEFAULT 'system',
  plan TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_touch_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ WATCHLIST ============
CREATE TABLE public.watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  commodity_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, commodity_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watchlist TO authenticated;
GRANT ALL ON public.watchlist TO service_role;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own watchlist" ON public.watchlist FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ PRICE SNAPSHOTS (server cache, publicly readable) ============
CREATE TABLE public.price_snapshots (
  commodity_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  price NUMERIC NOT NULL,
  change_abs NUMERIC,
  change_pct NUMERIC,
  high_24h NUMERIC,
  low_24h NUMERIC,
  sparkline JSONB,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (commodity_id, currency)
);
GRANT SELECT ON public.price_snapshots TO anon, authenticated;
GRANT ALL ON public.price_snapshots TO service_role;
ALTER TABLE public.price_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read price snapshots" ON public.price_snapshots FOR SELECT TO anon, authenticated USING (true);

-- ============ PRICE HISTORY (chart cache) ============
CREATE TABLE public.price_history (
  commodity_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  series JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (commodity_id, currency, timeframe)
);
GRANT SELECT ON public.price_history TO anon, authenticated;
GRANT ALL ON public.price_history TO service_role;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read price history" ON public.price_history FOR SELECT TO anon, authenticated USING (true);

-- ============ AI FORECASTS ============
CREATE TABLE public.ai_forecasts (
  commodity_id TEXT NOT NULL,
  horizon TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  predicted_price NUMERIC,
  direction TEXT,
  confidence NUMERIC,
  rationale TEXT,
  sentiment TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (commodity_id, horizon, currency)
);
GRANT SELECT ON public.ai_forecasts TO anon, authenticated;
GRANT ALL ON public.ai_forecasts TO service_role;
ALTER TABLE public.ai_forecasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read forecasts" ON public.ai_forecasts FOR SELECT TO anon, authenticated USING (true);
