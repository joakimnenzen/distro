import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import crypto from 'crypto'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase-admin'
import { getResend, getResendFrom } from '@/lib/resend'

export const runtime = 'nodejs'

function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error('Missing env: STRIPE_WEBHOOK_SECRET')
  return secret
}

function isUniqueViolation(err: any) {
  return err?.code === '23505' || String(err?.message || '').toLowerCase().includes('duplicate')
}

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

export async function POST(req: Request) {
  const stripe = getStripe()
  const admin = createAdminClient()

  const sig = req.headers.get('stripe-signature')
  if (!sig) {
    console.error('[stripe-webhook] Missing stripe-signature header')
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  // In Next.js 15, we need to handle the body differently for webhooks
  let body: string
  try {
    const rawBody = await req.arrayBuffer()
    body = Buffer.from(rawBody).toString('utf8')
  } catch (err) {
    console.error('[stripe-webhook] Failed to read request body:', err)
    return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, getWebhookSecret())
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Idempotency: store event id
  const { error: eventInsertError } = await admin.from('stripe_events').insert({
    event_id: event.id,
    type: event.type,
  })

  if (eventInsertError) {
    if (isUniqueViolation(eventInsertError)) {
      return NextResponse.json({ received: true })
    }
    console.error('[stripe-webhook] stripe_events insert error', eventInsertError)
    return NextResponse.json({ error: 'Failed to store event' }, { status: 500 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const kind = session.metadata?.kind
        const donationId = session.metadata?.donation_id
        const purchaseId = session.metadata?.purchase_id
        const paymentIntentId =
          typeof session.payment_intent === 'string' ? session.payment_intent : null

        if (kind === 'purchase' || purchaseId) {
          const sid = session.id
          const buyerEmail =
            session.customer_details?.email || session.customer_email || session.metadata?.buyer_email

          // Mark purchase paid
          if (purchaseId) {
            await admin
              .from('purchases')
              .update({
                status: 'paid',
                stripe_checkout_session_id: sid,
                stripe_payment_intent_id: paymentIntentId,
                ...(buyerEmail ? { buyer_email: buyerEmail } : {}),
              })
              .eq('id', purchaseId)
          } else {
            await admin
              .from('purchases')
              .update({
                status: 'paid',
                stripe_payment_intent_id: paymentIntentId,
                ...(buyerEmail ? { buyer_email: buyerEmail } : {}),
              })
              .eq('stripe_checkout_session_id', sid)
          }

          // Fetch purchase with album delivery info
          const { data: purchase } = purchaseId
            ? await admin
                .from('purchases')
                .select(
                  `
                  id,
                  buyer_email,
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
                .eq('id', purchaseId)
                .single()
            : await admin
                .from('purchases')
                .select(
                  `
                  id,
                  buyer_email,
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
                .eq('stripe_checkout_session_id', sid)
                .single()

          const album = purchase?.albums
            ? (Array.isArray(purchase.albums) ? purchase.albums[0] : purchase.albums)
            : null
          const band = purchase?.bands
            ? (Array.isArray(purchase.bands) ? purchase.bands[0] : purchase.bands)
            : null

          if (purchase?.buyer_email && album?.download_zip_path) {
            const rawToken = createRawToken()
            const tokenHash = hashToken(rawToken)
            const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days

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
                to: purchase.buyer_email,
                subject: `Your download: ${album?.title ?? 'Album'}`,
                html: `
                  <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; line-height: 1.6;">
                    <h2 style="font-family: ui-sans-serif, system-ui; margin: 0 0 12px;">Thanks for supporting ${band?.name ?? 'the band'}</h2>
                    <p style="margin: 0 0 12px;">Here is your single-use download link (expires in 7 days):</p>
                    <p style="margin: 0 0 16px;"><a href="${downloadUrl}">${downloadUrl}</a></p>
                    <p style="margin: 0; color: rgba(255,255,255,0.6);">If you used this link already, you can request a new one from the purchase success page.</p>
                  </div>
                `,
              })
            } catch (e) {
              // Don't fail the whole webhook if email sending fails; user can resend manually.
              console.error('[stripe-webhook] Resend send failed', e)
            }
          }
        } else if (donationId) {
          await admin
            .from('donations')
            .update({
              status: 'succeeded',
              stripe_checkout_session_id: session.id,
              stripe_payment_intent_id: paymentIntentId,
            })
            .eq('id', donationId)
        } else {
          await admin
            .from('donations')
            .update({
              status: 'succeeded',
              stripe_payment_intent_id: paymentIntentId,
            })
            .eq('stripe_checkout_session_id', session.id)
        }
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.metadata?.kind === 'purchase' || session.metadata?.purchase_id) {
          const pid = session.metadata?.purchase_id
          if (pid) {
            await admin.from('purchases').update({ status: 'failed' }).eq('id', pid)
          } else {
            await admin
              .from('purchases')
              .update({ status: 'failed' })
              .eq('stripe_checkout_session_id', session.id)
          }
          break
        }
        await admin
          .from('donations')
          .update({ status: 'failed' })
          .eq('stripe_checkout_session_id', session.id)
        break
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent
        const donationId = (pi.metadata as any)?.donation_id as string | undefined
        const purchaseId = (pi.metadata as any)?.purchase_id as string | undefined

        if (purchaseId) {
          await admin.from('purchases').update({ status: 'failed' }).eq('id', purchaseId)
        } else if (donationId) {
          await admin.from('donations').update({ status: 'failed' }).eq('id', donationId)
        } else {
          await admin
            .from('donations')
            .update({ status: 'failed' })
            .eq('stripe_payment_intent_id', pi.id)
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId =
          typeof charge.payment_intent === 'string' ? charge.payment_intent : null
        if (paymentIntentId) {
          await admin
            .from('purchases')
            .update({ status: 'refunded' })
            .eq('stripe_payment_intent_id', paymentIntentId)
          await admin
            .from('donations')
            .update({ status: 'refunded' })
            .eq('stripe_payment_intent_id', paymentIntentId)
        }
        break
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        await admin
          .from('bands')
          .update({
            stripe_charges_enabled: Boolean(account.charges_enabled),
            stripe_payouts_enabled: Boolean(account.payouts_enabled),
          })
          .eq('stripe_account_id', account.id)
        break
      }

      default:
        break
    }

    await admin
      .from('stripe_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('event_id', event.id)

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[stripe-webhook] handler error', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}


