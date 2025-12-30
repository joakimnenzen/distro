import { createAdminClient } from '@/lib/supabase-admin'
import { fulfillPurchaseFromSessionId } from '@/lib/purchase-delivery'
import Link from 'next/link'
import { ResendDownloadLinkForm } from '@/components/resend-download-link-form'

interface PurchaseSuccessPageProps {
  searchParams: Promise<{
    session_id?: string
  }>
}

export default async function PurchaseSuccessPage({ searchParams }: PurchaseSuccessPageProps) {
  const { session_id } = await searchParams
  const admin = createAdminClient()

  let { data: purchase } = session_id
    ? await admin
        .from('purchases')
        .select(
          `
          id,
          status,
          amount,
          currency,
          buyer_email,
          albums (
            title
          ),
          bands (
            name,
            slug
          )
        `
        )
        .eq('stripe_checkout_session_id', session_id)
        .single()
    : { data: null as any }

  // Local-dev friendly: if webhook didn't fire yet, verify the Stripe session directly
  // and send the email from here. This keeps the flow reliable on localhost.
  if (purchase && session_id && purchase.status !== 'paid') {
    await fulfillPurchaseFromSessionId(session_id)
    ;({ data: purchase } = await admin
      .from('purchases')
      .select(
        `
        id,
        status,
        amount,
        currency,
        buyer_email,
        albums (
          title
        ),
        bands (
          name,
          slug
        )
      `
      )
      .eq('stripe_checkout_session_id', session_id)
      .single())
  }

  const band = purchase?.bands ? (Array.isArray(purchase.bands) ? purchase.bands[0] : purchase.bands) : null
  const album = purchase?.albums
    ? (Array.isArray(purchase.albums) ? purchase.albums[0] : purchase.albums)
    : null
  const amountSek =
    typeof purchase?.amount === 'number' ? (purchase.amount / 100).toFixed(0) : null

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-black/50 p-8 backdrop-blur">
          <h1 className="font-sans text-3xl font-semibold text-white">Purchase complete</h1>

          {purchase ? (
            <p className="mt-3 font-mono text-sm text-white/70">
              {amountSek ? `${amountSek} SEK` : 'Your purchase'} for{' '}
              <span className="text-white">“{album?.title ?? 'Album'}”</span> is{' '}
              <span className="text-white">
                {purchase.status === 'paid' ? 'confirmed' : 'processing'}
              </span>
              .
              <br />
              We’ll email a single-use download link to <span className="text-white">{purchase.buyer_email}</span>.
            </p>
          ) : (
            <p className="mt-3 font-mono text-sm text-white/70">
              Your purchase is processing. If this page doesn’t update, refresh in a moment.
            </p>
          )}

          {purchase && session_id && (
            <div className="mt-6 rounded-lg border border-white/10 bg-black/40 p-4">
              <h2 className="font-sans text-base text-white">Wrong email?</h2>
              <p className="mt-1 font-mono text-xs text-white/60">
                Enter the correct email and we’ll send a fresh single-use link.
              </p>

              <ResendDownloadLinkForm sessionId={session_id} defaultEmail={purchase.buyer_email} />
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {band?.slug ? (
              <Link
                href={`/band/${band.slug}`}
                className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-mono text-black hover:bg-white/90"
              >
                Back to {band.name}
              </Link>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-mono text-black hover:bg-white/90"
              >
                Back home
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


