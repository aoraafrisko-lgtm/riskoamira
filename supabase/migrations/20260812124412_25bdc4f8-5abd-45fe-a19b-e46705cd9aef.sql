-- Single invitation config
CREATE TABLE public.invitation (
  id text PRIMARY KEY DEFAULT 'main',
  draft_config jsonb NOT NULL DEFAULT '{"sections":[],"theme":{}}'::jsonb,
  published_config jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.invitation TO anon, authenticated;
GRANT ALL ON public.invitation TO service_role;
ALTER TABLE public.invitation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Invitation is publicly readable" ON public.invitation FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.invitation (id) VALUES ('main');

-- Guests
CREATE TABLE public.guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  token text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'Umum',
  greeting text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.guests TO service_role;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

-- RSVP
CREATE TABLE public.rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid REFERENCES public.guests(id) ON DELETE SET NULL,
  guest_name text NOT NULL,
  attending boolean NOT NULL,
  headcount integer NOT NULL DEFAULT 1,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.rsvps TO service_role;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

-- Media library
CREATE TABLE public.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  kind text NOT NULL DEFAULT 'image',
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.media TO anon, authenticated;
GRANT ALL ON public.media TO service_role;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Media is publicly readable" ON public.media FOR SELECT TO anon, authenticated USING (true);
