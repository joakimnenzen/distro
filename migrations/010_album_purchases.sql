-- Album purchases (digital downloads) + one-time download tokens

-- Albums: enable digital purchase and store where the ZIP lives
ALTER TABLE albums
ADD COLUMN IF NOT EXISTS is_purchasable BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS price_ore INTEGER,
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'sek',
ADD COLUMN IF NOT EXISTS download_bucket TEXT NOT NULL DEFAULT 'downloads',
ADD COLUMN IF NOT EXISTS download_zip_path TEXT;

-- Purchases table (guest checkout supported via buyer_email)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE NOT NULL,
  band_id UUID REFERENCES bands(id) ON DELETE CASCADE NOT NULL,
  buyer_email TEXT NOT NULL,
  amount INTEGER NOT NULL, -- minor units (öre for SEK)
  currency TEXT NOT NULL DEFAULT 'sek',
  status TEXT NOT NULL DEFAULT 'requires_payment',
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- One-time download tokens (store hash, never store the raw token)
CREATE TABLE IF NOT EXISTS download_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE download_tokens ENABLE ROW LEVEL SECURITY;

-- Policies:
-- Purchases: band owners can read purchases for their bands.
CREATE POLICY "Band owners can read purchases" ON purchases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bands
      WHERE bands.id = purchases.band_id
      AND bands.owner_id = auth.uid()
    )
  );

-- Note: No INSERT/UPDATE policies on purchases/download_tokens.
-- Server-only code should use the Supabase Service Role key (bypasses RLS).


