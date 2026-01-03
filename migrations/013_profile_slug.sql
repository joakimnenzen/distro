-- Add profiles.slug to support /user/:username profile URLs (slug is the URL-safe username)

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill slugs for existing profiles (based on username, often email; use local-part)
DO $$
DECLARE
  r RECORD;
  base_slug TEXT;
  candidate TEXT;
  i INT;
BEGIN
  FOR r IN SELECT id, username FROM profiles WHERE slug IS NULL OR slug = '' LOOP
    base_slug := lower(coalesce(nullif(split_part(r.username, '@', 1), ''), r.username, 'user'));
    -- slugify-ish: keep a-z0-9 and dashes
    base_slug := regexp_replace(base_slug, '[^a-z0-9\\s-]', '', 'g');
    base_slug := regexp_replace(base_slug, '\\s+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := regexp_replace(base_slug, '(^-+|-+$)', '', 'g');
    IF base_slug = '' THEN
      base_slug := 'user';
    END IF;

    candidate := left(base_slug, 40);
    i := 0;
    WHILE EXISTS (SELECT 1 FROM profiles p WHERE p.slug = candidate AND p.id <> r.id) LOOP
      i := i + 1;
      candidate := left(base_slug, 36) || '-' || i::text;
    END LOOP;

    UPDATE profiles SET slug = candidate WHERE id = r.id;
  END LOOP;
END $$;

-- Require slug going forward
ALTER TABLE profiles
ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_slug_unique ON profiles (slug);

-- Ensure new users get a slug on signup by updating the existing trigger function.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  candidate TEXT;
  i INT;
BEGIN
  base_slug := lower(coalesce(nullif(split_part(NEW.email, '@', 1), ''), 'user'));
  base_slug := regexp_replace(base_slug, '[^a-z0-9\\s-]', '', 'g');
  base_slug := regexp_replace(base_slug, '\\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := regexp_replace(base_slug, '(^-+|-+$)', '', 'g');
  IF base_slug = '' THEN
    base_slug := 'user';
  END IF;

  candidate := left(base_slug, 40);
  i := 0;
  WHILE EXISTS (SELECT 1 FROM public.profiles p WHERE p.slug = candidate) LOOP
    i := i + 1;
    candidate := left(base_slug, 36) || '-' || i::text;
  END LOOP;

  INSERT INTO public.profiles (id, username, slug)
  VALUES (NEW.id, NEW.email, candidate);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


