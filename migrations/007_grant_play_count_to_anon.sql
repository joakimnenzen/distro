-- Migration: Grant play count increment to anonymous users
-- Description: Allows guests (anonymous users) to increment play counts for statistics

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION increment_play_count(UUID) TO anon;

-- Update comment for documentation
COMMENT ON FUNCTION increment_play_count(UUID) IS 'Increments the play_count for a track by 1. Used by the player component when a user listens to a track for more than 30 seconds. Available to both authenticated and anonymous users for accurate statistics.';
