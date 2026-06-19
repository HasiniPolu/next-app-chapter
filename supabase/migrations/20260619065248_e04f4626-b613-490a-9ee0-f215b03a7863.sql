
-- alerts table
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

CREATE POLICY "Users manage own alerts"
  ON public.alerts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER alerts_touch_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX alerts_user_active_idx ON public.alerts(user_id, active);
CREATE INDEX alerts_active_idx ON public.alerts(active) WHERE active = true;

-- extend watchlist for stocks
ALTER TABLE public.watchlist
  ADD COLUMN IF NOT EXISTS asset_kind text NOT NULL DEFAULT 'commodity'
  CHECK (asset_kind IN ('commodity','stock'));
