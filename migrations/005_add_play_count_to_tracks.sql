-- Migration: Add play_count column to tracks table
-- Description: Adds play_count field to track play statistics

-- Add play_count column to tracks table
ALTER TABLE tracks
ADD COLUMN play_count INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN tracks.play_count IS 'Number of times this track has been played';

-- Create index for performance if needed for queries
-- CREATE INDEX idx_tracks_play_count ON tracks(play_count);
