ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS hash text,
  ADD COLUMN IF NOT EXISTS size bigint,
  ADD COLUMN IF NOT EXISTS content_type text,
  ADD COLUMN IF NOT EXISTS path text;

CREATE UNIQUE INDEX IF NOT EXISTS media_hash_key ON public.media (hash) WHERE hash IS NOT NULL;

GRANT ALL ON public.media TO service_role;