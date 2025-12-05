-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table linked to auth.users
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bands table
CREATE TABLE bands (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create albums table
CREATE TABLE albums (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  release_date DATE,
  cover_image_url TEXT,
  band_id UUID REFERENCES bands(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tracks table
CREATE TABLE tracks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  duration INTEGER, -- in seconds
  track_number INTEGER NOT NULL,
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
-- Public read access
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for bands
-- Public read access
CREATE POLICY "Public bands are viewable by everyone" ON bands
  FOR SELECT USING (true);

-- Owners can insert bands
CREATE POLICY "Owners can insert bands" ON bands
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Owners can update their bands
CREATE POLICY "Owners can update their bands" ON bands
  FOR UPDATE USING (auth.uid() = owner_id);

-- Owners can delete their bands
CREATE POLICY "Owners can delete their bands" ON bands
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for albums
-- Public read access
CREATE POLICY "Public albums are viewable by everyone" ON albums
  FOR SELECT USING (true);

-- Band owners can insert albums
CREATE POLICY "Band owners can insert albums" ON albums
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bands
      WHERE bands.id = albums.band_id
      AND bands.owner_id = auth.uid()
    )
  );

-- Band owners can update albums
CREATE POLICY "Band owners can update albums" ON albums
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bands
      WHERE bands.id = albums.band_id
      AND bands.owner_id = auth.uid()
    )
  );

-- Band owners can delete albums
CREATE POLICY "Band owners can delete albums" ON albums
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM bands
      WHERE bands.id = albums.band_id
      AND bands.owner_id = auth.uid()
    )
  );

-- RLS Policies for tracks
-- Public read access
CREATE POLICY "Public tracks are viewable by everyone" ON tracks
  FOR SELECT USING (true);

-- Band owners can insert tracks
CREATE POLICY "Band owners can insert tracks" ON tracks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM albums
      JOIN bands ON albums.band_id = bands.id
      WHERE albums.id = tracks.album_id
      AND bands.owner_id = auth.uid()
    )
  );

-- Band owners can update tracks
CREATE POLICY "Band owners can update tracks" ON tracks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM albums
      JOIN bands ON albums.band_id = bands.id
      WHERE albums.id = tracks.album_id
      AND bands.owner_id = auth.uid()
    )
  );

-- Band owners can delete tracks
CREATE POLICY "Band owners can delete tracks" ON tracks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM albums
      JOIN bands ON albums.band_id = bands.id
      WHERE albums.id = tracks.album_id
      AND bands.owner_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_bands_owner_id ON bands(owner_id);
CREATE INDEX idx_bands_slug ON bands(slug);
CREATE INDEX idx_albums_band_id ON albums(band_id);
CREATE INDEX idx_tracks_album_id ON tracks(album_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_bands_updated_at BEFORE UPDATE ON bands
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON albums
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON tracks
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
