-- Migration: Add profile fields to bands table
-- Description: Adds image_url, genre, and location columns for enhanced band profiles

-- Add new columns to bands table
ALTER TABLE bands
ADD COLUMN image_url TEXT,
ADD COLUMN genre TEXT,
ADD COLUMN location TEXT;

-- Add comments for documentation
COMMENT ON COLUMN bands.image_url IS 'URL of the band profile image stored in Supabase Storage';
COMMENT ON COLUMN bands.genre IS 'Primary genre of the band (e.g., Rock, Indie, Electronic)';
COMMENT ON COLUMN bands.location IS 'Location of the band (e.g., Stockholm, Sweden)';

-- Note: No RLS policies need to be updated as the existing policies already
-- allow band owners to update their bands, and these are just additional fields.
