DROP POLICY IF EXISTS "Invitation is publicly readable" ON public.invitation;

REVOKE ALL ON public.invitation FROM anon, authenticated;
GRANT ALL ON public.invitation TO service_role;

CREATE POLICY "invitation deny all client access"
  ON public.invitation AS RESTRICTIVE
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);