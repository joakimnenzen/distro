import Stripe from 'stripe'

declare global {
  // eslint-disable-next-line no-var
  var __stripe: Stripe | undefined
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Missing env: STRIPE_SECRET_KEY')

  if (!global.__stripe) {
    global.__stripe = new Stripe(key, {
      typescript: true,
    })
  }

  return global.__stripe
}


