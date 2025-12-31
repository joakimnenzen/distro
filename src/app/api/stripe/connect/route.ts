import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getStripe } from '@/lib/stripe'

function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL
  if (!url) throw new Error('Missing env: NEXT_PUBLIC_SITE_URL')
  return url.replace(/\/$/, '')
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const bandId = searchParams.get('bandId')
  if (!bandId) {
    return NextResponse.json({ error: 'Missing bandId' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: band, error: bandError } = await admin
    .from('bands')
    .select('id, slug, owner_id, stripe_account_id')
    .eq('id', bandId)
    .single()

  if (bandError || !band) {
    return NextResponse.json({ error: 'Band not found' }, { status: 404 })
  }

  if (band.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const stripe = getStripe()

  let stripeAccountId = band.stripe_account_id as string | null
  if (!stripeAccountId) {
    const acct = await stripe.accounts.create({
      type: 'express',
      country: 'SE',
      business_type: 'individual',
      email: (user as any)?.email ?? undefined,
      capabilities: {
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

  return NextResponse.redirect(accountLink.url, { status: 303 })
}


