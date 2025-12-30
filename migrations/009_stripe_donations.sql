-- Stripe Connect + Donations (Support/Donate)

-- Bands: store connected account + status flags
ALTER TABLE bands
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- Donations table
CREATE TABLE IF NOT EXISTS donations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  band_id UUID REFERENCES bands(id) ON DELETE CASCADE NOT NULL,
  supporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL, -- minor units (öre for SEK)
  currency TEXT NOT NULL DEFAULT 'sek',
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'requires_payment',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Stripe event idempotency (recommended)
CREATE TABLE IF NOT EXISTS stripe_events (
  event_id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

-- Donations policies:
-- - Band owners can read donations for their bands
-- - Supporters can read their own donations
CREATE POLICY "Band owners can read donations" ON donations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bands
      WHERE bands.id = donations.band_id
      AND bands.owner_id = auth.uid()
    )
  );

CREATE POLICY "Supporters can read their donations" ON donations
  FOR SELECT USING (donations.supporter_id = auth.uid());

-- Note: No INSERT/UPDATE policies on donations/stripe_events.
-- Server-only code should use the Supabase Service Role key (bypasses RLS).


