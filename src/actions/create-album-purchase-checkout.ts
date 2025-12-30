'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'
import { getStripe } from '@/lib/stripe'

const purchaseSchema = z.object({
  albumId: z.string().uuid(),
  buyerEmail: z.string().email(),
})

function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL
  if (!url) throw new Error('Missing env: NEXT_PUBLIC_SITE_URL')
  return url.replace(/\/$/, '')
}

function computeFeeOre(amountOre: number) {
  // 5% + 0.50 SEK (50 öre), rounded to nearest öre
  return Math.round(amountOre * 0.05) + 50
}

export async function createAlbumPurchaseCheckout(formData: FormData): Promise<void> {
  try {
    const parsed = purchaseSchema.safeParse({
      albumId: formData.get('albumId'),
      buyerEmail: formData.get('buyerEmail'),
    })

    if (!parsed.success) return

    const { albumId, buyerEmail } = parsed.data

    // Optional auth (guest checkout allowed)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const admin = createAdminClient()

    const { data: album } = await admin
      .from('albums')
      .select('id, title, band_id, is_purchasable, price_ore, currency, download_bucket, download_zip_path')
      .eq('id', albumId)
      .single()

    if (!album) return
    if (!album.is_purchasable) return
    if (!album.price_ore || album.price_ore <= 0) return
    if (!album.download_zip_path) return

    const { data: band } = await admin
      .from('bands')
      .select('id, name, slug, stripe_account_id, stripe_payouts_enabled')
      .eq('id', album.band_id)
      .single()

    if (!band) return
    if (!band.stripe_account_id) return
    if (!band.stripe_payouts_enabled) return

    const amountOre = album.price_ore
    const feeOre = computeFeeOre(amountOre)
    if (feeOre >= amountOre) return

    const { data: purchase } = await admin
      .from('purchases')
      .insert({
        album_id: album.id,
        band_id: band.id,
        buyer_email: buyerEmail,
        amount: amountOre,
        currency: album.currency ?? 'sek',
        status: 'requires_payment',
      })
      .select('id')
      .single()

    if (!purchase) return

    const stripe = getStripe()
    const siteUrl = getSiteUrl()

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: buyerEmail,
      success_url: `${siteUrl}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/album/${album.id}`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: album.currency ?? 'sek',
            unit_amount: amountOre,
            product_data: {
              name: `Digital album: ${album.title}`,
            },
          },
        },
      ],
      metadata: {
        kind: 'purchase',
        purchase_id: purchase.id,
        album_id: album.id,
        band_id: band.id,
      },
      payment_intent_data: {
        application_fee_amount: feeOre,
        transfer_data: {
          destination: band.stripe_account_id,
        },
        metadata: {
          kind: 'purchase',
          purchase_id: purchase.id,
          album_id: album.id,
          band_id: band.id,
          user_id: user?.id ?? '',
        },
      },
    })

    await admin
      .from('purchases')
      .update({
        stripe_checkout_session_id: session.id,
        status: 'requires_payment',
      })
      .eq('id', purchase.id)

    if (!session.url) return
    redirect(session.url)
  } catch (e) {
    // next/navigation redirect() throws a special error that must bubble up
    if (
      typeof (e as any)?.digest === 'string' &&
      ((e as any).digest as string).startsWith('NEXT_REDIRECT')
    ) {
      throw e
    }
    console.error('[createAlbumPurchaseCheckout] error', e)
    return
  }
}


