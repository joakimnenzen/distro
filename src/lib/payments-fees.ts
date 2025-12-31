export const MIN_PAYMENT_SEK = 10

// Stripe (Sweden, standard EEA cards, SEK): 1.5% + 1.80 SEK
// Note: This is a typical fee. Some cards/transactions can be higher.
const STRIPE_PERCENT = 0.015
const STRIPE_FIXED_ORE = 180

// Distro platform fee: 5% + 0.50 SEK
const DISTRO_PERCENT = 0.05
const DISTRO_FIXED_ORE = 50

export function toOreFromSek(amountSek: number) {
  return Math.round(amountSek * 100)
}

export function computeStripeFeeOre(amountOre: number) {
  return Math.round(amountOre * STRIPE_PERCENT) + STRIPE_FIXED_ORE
}

export function computeDistroFeeOre(amountOre: number) {
  return Math.round(amountOre * DISTRO_PERCENT) + DISTRO_FIXED_ORE
}

/**
 * We use destination charges, so Stripe charges the processing fee to the platform.
 * To avoid negative platform balance, we set application_fee_amount to:
 *   Stripe fee + Distro fee
 *
 * This effectively passes the Stripe processing fee through (reducing band payout),
 * while keeping Distro's platform fee intact.
 */
export function computeApplicationFeeOre(amountOre: number) {
  return computeStripeFeeOre(amountOre) + computeDistroFeeOre(amountOre)
}


