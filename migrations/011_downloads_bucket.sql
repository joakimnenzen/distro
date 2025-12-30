-- Create downloads bucket for private digital album ZIPs
-- Recommended: keep private (public = false). Downloads are served via short-lived signed URLs.

INSERT INTO storage.buckets (id, name, public)
VALUES ('downloads', 'downloads', false)
ON CONFLICT (id) DO NOTHING;


