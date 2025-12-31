'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getStripe } from '@/lib/stripe'

function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL
  if (!url) throw new Error('Missing env: NEXT_PUBLIC_SITE_URL')
  return url.replace(/\/$/, '')
}

type StartOnboardingResult =
  | { success: true }
  | { success: false; error: string }

export async function startStripeConnectOnboarding(formData: FormData): Promise<void> {
  try {
    const bandId = formData.get('bandId')?.toString()
    if (!bandId) return

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const admin = createAdminClient()
    const { data: band, error: bandError } = await admin
      .from('bands')
      .select('id, slug, name, owner_id, stripe_account_id')
      .eq('id', bandId)
      .single()

    if (bandError || !band) return
    if (band.owner_id !== user.id) return

    const stripe = getStripe()

    let stripeAccountId = band.stripe_account_id as string | null
    if (!stripeAccountId) {
      const acct = await stripe.accounts.create({
        type: 'express',
        country: 'SE',
        // Make onboarding friendlier for small creators by defaulting to individual.
        // (Stripe will still collect required identity + bank details.)
        business_type: 'individual',
        email: (user as any)?.email ?? undefined,
        capabilities: {
          // We use destination charges (platform creates the PaymentIntent) and transfer proceeds.
          // The connected account primarily needs transfers to receive funds.
          transfers: { requested: true },
        },
        business_profile: {
          product_description: 'Payments & support for bands on Distro (digital albums + fan support)',
        },
        metadata: {
          band_id: band.id,
        },
      })

      stripeAccountId = acct.id

      await admin
        .from('bands')
        .update({
          stripe_account_id: stripeAccountId,
        })
        .eq('id', band.id)
    }

    const siteUrl = getSiteUrl()
    const returnUrl = `${siteUrl}/band/${band.slug}?stripe=return`
    const refreshUrl = `${siteUrl}/band/${band.slug}?stripe=refresh`

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      type: 'account_onboarding',
      return_url: returnUrl,
      refresh_url: refreshUrl,
    })

    redirect(accountLink.url)
  } catch (e) {
    // next/navigation redirect() throws a special error that must bubble up
    if (
      typeof (e as any)?.digest === 'string' &&
      ((e as any).digest as string).startsWith('NEXT_REDIRECT')
    ) {
      throw e
    }
    console.error('[startStripeConnectOnboarding] error', e)
    return
  }
}


