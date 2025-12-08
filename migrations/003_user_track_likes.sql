-- Create user_track_likes junction table
CREATE TABLE user_track_likes (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, track_id)
);

-- Enable Row Level Security
ALTER TABLE user_track_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_track_likes
-- Users can view their own likes
CREATE POLICY "Users can view their own likes" ON user_track_likes
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own likes
CREATE POLICY "Users can insert their own likes" ON user_track_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete their own likes" ON user_track_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_user_track_likes_user_id ON user_track_likes(user_id);
CREATE INDEX idx_user_track_likes_track_id ON user_track_likes(track_id);
CREATE INDEX idx_user_track_likes_created_at ON user_track_likes(created_at);
