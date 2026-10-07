-- Run only against the intended Supabase project after reviewing existing policies.
-- Kept separate from Prisma migrations: ordinary PostgreSQL has no storage schema.
BEGIN;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('listing-media', 'listing-media', true, 5242880, ARRAY['image/png','image/jpeg','image/webp']),
  ('private-media', 'private-media', false, 5242880, ARRAY['image/png','image/jpeg','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Do not silently change visibility on an existing bucket containing user data.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE (id = 'private-media' AND public) OR (id = 'listing-media' AND NOT public)) THEN
    RAISE EXCEPTION 'Existing media bucket visibility conflicts with the reviewed design';
  END IF;
END $$;

-- Restrictive guard composes with existing permissive policies. All object operations
-- for these buckets go through the backend service role, which bypasses RLS.
-- Public listing assets can still be downloaded using the public object endpoint.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='pasopkan_backend_media_only') THEN
    CREATE POLICY pasopkan_backend_media_only ON storage.objects AS RESTRICTIVE
      FOR ALL TO anon, authenticated
      USING (bucket_id NOT IN ('listing-media','private-media'))
      WITH CHECK (bucket_id NOT IN ('listing-media','private-media'));
  END IF;
END $$;
COMMIT;
