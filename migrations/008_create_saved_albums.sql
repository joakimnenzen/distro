-- Create saved_albums junction table
CREATE TABLE saved_albums (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, album_id)
);

-- Enable Row Level Security
ALTER TABLE saved_albums ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_albums
-- Users can view their own saved albums
CREATE POLICY "Users can view their own saved albums" ON saved_albums
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own saved albums
CREATE POLICY "Users can insert their own saved albums" ON saved_albums
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved albums
CREATE POLICY "Users can delete their own saved albums" ON saved_albums
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_saved_albums_user_id ON saved_albums(user_id);
CREATE INDEX idx_saved_albums_album_id ON saved_albums(album_id);
CREATE INDEX idx_saved_albums_created_at ON saved_albums(created_at);
