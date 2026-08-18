-- 1) Remove any direct Data API access to sensitive tables (server-side only)
REVOKE ALL ON public.admin_config FROM anon, authenticated;
REVOKE ALL ON public.guests FROM anon, authenticated;
REVOKE ALL ON public.rsvps FROM anon, authenticated;
GRANT ALL ON public.admin_config TO service_role;
GRANT ALL ON public.guests TO service_role;
GRANT ALL ON public.rsvps TO service_role;

-- 2) Explicit deny-by-default RESTRICTIVE policies (defense in depth)
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_config deny all client access" ON public.admin_config;
CREATE POLICY "admin_config deny all client access"
  ON public.admin_config AS RESTRICTIVE FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "guests deny all client access" ON public.guests;
CREATE POLICY "guests deny all client access"
  ON public.guests AS RESTRICTIVE FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "rsvps deny all client access" ON public.rsvps;
CREATE POLICY "rsvps deny all client access"
  ON public.rsvps AS RESTRICTIVE FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);

-- 3) Storage: block all client-side access to the private media bucket
DROP POLICY IF EXISTS "media bucket deny client access" ON storage.objects;
CREATE POLICY "media bucket deny client access"
  ON storage.objects AS RESTRICTIVE FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);