'use server'

import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getStripe } from '@/lib/stripe'

/**
 * Sync a band's Stripe Connect status flags from Stripe -> Supabase.
 *
 * Why:
 * - Webhooks are the ideal long-term source of truth.
 * - But during local dev, Connect account events can be hard to forward.
 * - This gives us a reliable "refresh status" path after onboarding.
 */
export async function syncBandStripeStatus(bandId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  const admin = createAdminClient()

  const { data: band } = await admin
    .from('bands')
    .select('id, owner_id, stripe_account_id')
    .eq('id', bandId)
    .single()

  if (!band) return
  if (band.owner_id !== user.id) return
  if (!band.stripe_account_id) return

  const stripe = getStripe()
  const acct = await stripe.accounts.retrieve(band.stripe_account_id)

  await admin
    .from('bands')
    .update({
      stripe_charges_enabled: Boolean(acct.charges_enabled),
      stripe_payouts_enabled: Boolean(acct.payouts_enabled),
    })
    .eq('id', band.id)
}


