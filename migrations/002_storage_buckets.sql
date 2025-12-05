-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('covers', 'covers', true),
  ('audio', 'audio', true); -- Making audio public for MVP, can be changed to authenticated later

-- RLS Policies for covers bucket
-- Allow public read access to covers
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'covers');

-- Allow authenticated users to upload covers
CREATE POLICY "Authenticated users can upload covers" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'covers'
    AND auth.role() = 'authenticated'
  );

-- Allow users to update their own cover uploads
CREATE POLICY "Users can update their own covers" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own cover uploads
CREATE POLICY "Users can delete their own covers" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS Policies for audio bucket
-- Allow public read access to audio files (for MVP)
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'audio');

-- Allow authenticated users to upload audio files
CREATE POLICY "Authenticated users can upload audio" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'audio'
    AND auth.role() = 'authenticated'
  );

-- Allow users to update their own audio uploads
CREATE POLICY "Users can update their own audio" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'audio'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own audio uploads
CREATE POLICY "Users can delete their own audio" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'audio'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
