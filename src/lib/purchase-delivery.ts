import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase-admin'
import { getResend, getResendFrom } from '@/lib/resend'
import { getStripe } from '@/lib/stripe'

function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL
  if (!url) throw new Error('Missing env: NEXT_PUBLIC_SITE_URL')
  return url.replace(/\/$/, '')
}

function createRawToken() {
  return crypto.randomBytes(32).toString('base64url')
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Fulfill a purchase by Stripe Checkout Session ID:
 * - verifies payment status with Stripe
 * - marks purchase paid
 * - generates a single-use download token
 * - emails link via Resend
 *
 * Useful in local dev when webhooks might not hit localhost reliably.
 */
export async function fulfillPurchaseFromSessionId(
  sessionId: string,
  opts?: { overrideEmail?: string }
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const admin = createAdminClient()
    const stripe = getStripe()

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (!session) return { success: false, error: 'Checkout session not found' }

    // Stripe considers the payment complete when payment_status is 'paid'
    if (session.payment_status !== 'paid') {
      return { success: false, error: `Payment not complete (${session.payment_status})` }
    }

    const email =
      opts?.overrideEmail ||
      session.customer_details?.email ||
      session.customer_email ||
      undefined

    if (!email) return { success: false, error: 'Missing customer email' }

    const { data: purchase } = await admin
      .from('purchases')
      .select(
        `
        id,
        status,
        buyer_email,
        stripe_payment_intent_id,
        albums (
          title,
          download_bucket,
          download_zip_path
        ),
        bands (
          name
        )
      `
      )
      .eq('stripe_checkout_session_id', sessionId)
      .single()

    if (!purchase) return { success: false, error: 'Purchase not found' }

    const album = purchase.albums
      ? Array.isArray(purchase.albums)
        ? purchase.albums[0]
        : purchase.albums
      : null
    const band = purchase.bands
      ? Array.isArray(purchase.bands)
        ? purchase.bands[0]
        : purchase.bands
      : null

    if (!album?.download_zip_path) {
      return { success: false, error: 'Album download ZIP not ready yet' }
    }

    // Mark paid + set email (idempotent-ish)
    await admin
      .from('purchases')
      .update({
        status: 'paid',
        buyer_email: email,
        stripe_payment_intent_id:
          typeof session.payment_intent === 'string' ? session.payment_intent : purchase.stripe_payment_intent_id,
      })
      .eq('id', purchase.id)

    // Create single-use token (7 days)
    const rawToken = createRawToken()
    const tokenHash = hashToken(rawToken)
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)

    await admin.from('download_tokens').insert({
      purchase_id: purchase.id,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    })

    const downloadUrl = `${getSiteUrl()}/download/${rawToken}`

    const resend = getResend()
    try {
      await resend.emails.send({
        from: getResendFrom(),
        to: email,
        subject: `Your download: ${album?.title ?? 'Album'}`,
        html: `
          <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; line-height: 1.6;">
            <h2 style="font-family: ui-sans-serif, system-ui; margin: 0 0 12px;">Thanks for supporting ${band?.name ?? 'the band'}</h2>
            <p style="margin: 0 0 12px;">Here is your single-use download link (expires in 7 days):</p>
            <p style="margin: 0 0 16px;"><a href="${downloadUrl}">${downloadUrl}</a></p>
            <p style="margin: 0; color: rgba(255,255,255,0.6);">If you used this link already, request a new one from the purchase success page.</p>
          </div>
        `,
      })
    } catch (e) {
      console.error('[purchase-delivery] Resend send failed', e)
      return { success: false, error: 'Resend rejected the email (check verified sender/domain)' }
    }

    return { success: true }
  } catch (e) {
    console.error('[purchase-delivery] fulfill error', e)
    return { success: false, error: e instanceof Error ? e.message : 'Failed to fulfill purchase' }
  }
}


