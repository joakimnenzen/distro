-- RLS policies for playlists

-- Playlists are viewable by any authenticated user if public, or by the owner.
DROP POLICY IF EXISTS "Playlists are viewable by authenticated users" ON playlists;
CREATE POLICY "Playlists are viewable by authenticated users" ON playlists
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (is_public = true OR owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Owners can insert playlists" ON playlists;
CREATE POLICY "Owners can insert playlists" ON playlists
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update playlists" ON playlists;
CREATE POLICY "Owners can update playlists" ON playlists
  FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete playlists" ON playlists;
CREATE POLICY "Owners can delete playlists" ON playlists
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS policies for playlist_tracks
DROP POLICY IF EXISTS "Playlist tracks are viewable by authenticated users" ON playlist_tracks;
CREATE POLICY "Playlist tracks are viewable by authenticated users" ON playlist_tracks
  FOR SELECT USING (
    auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM playlists p
      WHERE p.id = playlist_tracks.playlist_id
      AND (p.is_public = true OR p.owner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Owners can insert playlist tracks" ON playlist_tracks;
CREATE POLICY "Owners can insert playlist tracks" ON playlist_tracks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists p
      WHERE p.id = playlist_tracks.playlist_id
      AND p.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can update playlist tracks" ON playlist_tracks;
CREATE POLICY "Owners can update playlist tracks" ON playlist_tracks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM playlists p
      WHERE p.id = playlist_tracks.playlist_id
      AND p.owner_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists p
      WHERE p.id = playlist_tracks.playlist_id
      AND p.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can delete playlist tracks" ON playlist_tracks;
CREATE POLICY "Owners can delete playlist tracks" ON playlist_tracks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM playlists p
      WHERE p.id = playlist_tracks.playlist_id
      AND p.owner_id = auth.uid()
    )
  );


