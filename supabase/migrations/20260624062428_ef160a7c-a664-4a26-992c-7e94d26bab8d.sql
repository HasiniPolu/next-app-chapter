
-- 1. Replace permissive profiles SELECT policy with own-row-only
DROP POLICY IF EXISTS "Public read basic profile" ON public.profiles;

-- "Users read own profile" already exists (auth.uid() = id), so nothing else needed.

-- 2. Restrict column-level UPDATE so authenticated cannot touch plan / stripe_customer_id
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, avatar_url, theme, currency, city, vehicle, safety_score, updated_at)
  ON public.profiles TO authenticated;

-- 3. Lock down SECURITY DEFINER helper functions from API roles.
--    has_role is used inside RLS policies; keep EXECUTE only for authenticated
--    (RLS expressions evaluate as the caller, so anon must still be blocked).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_privileged_profile_updates() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_hazard_upvotes() FROM PUBLIC, anon, authenticated;
