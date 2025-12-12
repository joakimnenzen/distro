-- Migration: Create RPC function to increment play count
-- Description: Creates a stored procedure to safely increment the play_count for a track

-- Create the RPC function to increment play count
CREATE OR REPLACE FUNCTION increment_play_count(t_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Increment the play_count for the specified track
  UPDATE tracks
  SET play_count = play_count + 1
  WHERE id = t_id;

  -- Check if the update affected any rows (track exists)
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Track with ID % not found', t_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_play_count(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION increment_play_count(UUID) IS 'Increments the play_count for a track by 1. Used by the player component when a user listens to a track for more than 30 seconds.';
