import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase-admin'

interface DonateSuccessPageProps {
  searchParams: Promise<{
    session_id?: string
  }>
}

export default async function DonateSuccessPage({ searchParams }: DonateSuccessPageProps) {
  const { session_id } = await searchParams

  const admin = createAdminClient()

  const { data: donation } = session_id
    ? await admin
        .from('donations')
        .select(
          `
          id,
          status,
          amount,
          currency,
          bands (
            name,
            slug
          )
        `
        )
        .eq('stripe_checkout_session_id', session_id)
        .single()
    : { data: null as any }

  const band = donation?.bands ? (Array.isArray(donation.bands) ? donation.bands[0] : donation.bands) : null
  const amountSek =
    typeof donation?.amount === 'number' ? (donation.amount / 100).toFixed(0) : null

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-black/50 p-8 backdrop-blur">
          <h1 className="font-sans text-3xl font-semibold text-white">Thanks for the support</h1>

          {donation ? (
            <p className="mt-3 font-mono text-sm text-white/70">
              {amountSek ? `${amountSek} SEK` : 'Your donation'} to{' '}
              <span className="text-white">{band?.name ?? 'the band'}</span> is{' '}
              <span className="text-white">
                {donation.status === 'succeeded' ? 'confirmed' : 'processing'}
              </span>
              .
            </p>
          ) : (
            <p className="mt-3 font-mono text-sm text-white/70">
              Your donation is processing. If this page doesn’t update, refresh in a moment.
            </p>
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


