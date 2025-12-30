'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getStripe } from '@/lib/stripe'

const donateSchema = z.object({
  bandId: z.string().uuid(),
  amountSek: z.coerce.number().int().min(1),
})

function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL
  if (!url) throw new Error('Missing env: NEXT_PUBLIC_SITE_URL')
  return url.replace(/\/$/, '')
}

function toOre(amountSek: number) {
  return amountSek * 100
}

function computeFeeOre(amountOre: number) {
  // 5% + 0.50 SEK, rounded to nearest öre
  return Math.round(amountOre * 0.05) + 50
}

type CreateDonationCheckoutResult =
  | { success: true }
  | { success: false; error: string }

export async function createDonationCheckout(formData: FormData): Promise<void> {
  try {
    const parsed = donateSchema.safeParse({
      bandId: formData.get('bandId'),
      amountSek: formData.get('amountSek'),
    })

    if (!parsed.success) {
      return
    }

    const { bandId, amountSek } = parsed.data
    const amountOre = toOre(amountSek)
    const feeOre = computeFeeOre(amountOre)

    if (feeOre >= amountOre) {
      return
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const admin = createAdminClient()
    const { data: band, error: bandError } = await admin
      .from('bands')
      .select('id, name, slug, stripe_account_id, stripe_payouts_enabled')
      .eq('id', bandId)
      .single()

    if (bandError || !band) return
    if (!band.stripe_account_id) return
    if (!band.stripe_payouts_enabled) return

    // Create donation row first (server-only; RLS blocked for anon)
    const { data: donation, error: donationError } = await admin
      .from('donations')
      .insert({
        band_id: band.id,
        supporter_id: user?.id ?? null,
        amount: amountOre,
        currency: 'sek',
        status: 'requires_payment',
      })
      .select('id')
      .single()

    if (donationError || !donation) {
      console.error('[createDonationCheckout] donation insert error', donationError)
      return
    }

    const stripe = getStripe()
    const siteUrl = getSiteUrl()

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${siteUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/band/${band.slug}`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'sek',
            unit_amount: amountOre,
            product_data: {
              name: `Support ${band.name}`,
            },
          },
        },
      ],
      metadata: {
        donation_id: donation.id,
        band_id: band.id,
      },
      payment_intent_data: {
        application_fee_amount: feeOre,
        transfer_data: {
          destination: band.stripe_account_id,
        },
        metadata: {
          donation_id: donation.id,
          band_id: band.id,
        },
      },
    })

    await admin
      .from('donations')
      .update({
        stripe_checkout_session_id: session.id,
        status: 'requires_payment',
      })
      .eq('id', donation.id)

    if (!session.url) {
      return
    }

    redirect(session.url)
  } catch (e) {
    // next/navigation redirect() throws a special error that must bubble up
    if (
      typeof (e as any)?.digest === 'string' &&
      ((e as any).digest as string).startsWith('NEXT_REDIRECT')
    ) {
      throw e
    }
    console.error('[createDonationCheckout] error', e)
    return
  }
}


