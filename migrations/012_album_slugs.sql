-- Add pretty slugs for albums so public URLs can be /:bandSlug/:albumSlug

ALTER TABLE albums
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Album slugs must be unique per band (allow NULLs for legacy rows)
CREATE UNIQUE INDEX IF NOT EXISTS albums_band_id_slug_unique
ON albums (band_id, slug)
WHERE slug IS NOT NULL;


