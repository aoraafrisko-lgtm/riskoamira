CREATE TABLE public.admin_config (
  id text PRIMARY KEY DEFAULT 'main',
  admin_code text NOT NULL DEFAULT '123456',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_config TO service_role;
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;
INSERT INTO public.admin_config (id, admin_code) VALUES ('main', '123456');
