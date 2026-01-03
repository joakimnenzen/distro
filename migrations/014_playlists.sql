-- Playlists MVP: owner-only editing, tracks-only items

CREATE TABLE IF NOT EXISTS playlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS playlist_tracks (
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE NOT NULL,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (playlist_id, track_id)
);

ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_playlists_owner_id ON playlists(owner_id);
CREATE INDEX IF NOT EXISTS idx_playlists_is_public ON playlists(is_public);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_position ON playlist_tracks(playlist_id, position);

-- Keep playlists.updated_at fresh on track changes
CREATE OR REPLACE FUNCTION public.touch_playlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.playlists
    SET updated_at = NOW()
    WHERE id = COALESCE(NEW.playlist_id, OLD.playlist_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS touch_playlist_on_insert ON playlist_tracks;
CREATE TRIGGER touch_playlist_on_insert
AFTER INSERT ON playlist_tracks
FOR EACH ROW EXECUTE PROCEDURE public.touch_playlist_updated_at();

DROP TRIGGER IF EXISTS touch_playlist_on_update ON playlist_tracks;
CREATE TRIGGER touch_playlist_on_update
AFTER UPDATE ON playlist_tracks
FOR EACH ROW EXECUTE PROCEDURE public.touch_playlist_updated_at();

DROP TRIGGER IF EXISTS touch_playlist_on_delete ON playlist_tracks;
CREATE TRIGGER touch_playlist_on_delete
AFTER DELETE ON playlist_tracks
FOR EACH ROW EXECUTE PROCEDURE public.touch_playlist_updated_at();


