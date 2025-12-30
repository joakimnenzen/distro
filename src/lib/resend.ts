import { Resend } from 'resend'

declare global {
  // eslint-disable-next-line no-var
  var __resend: Resend | undefined
}

export function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('Missing env: RESEND_API_KEY')

  if (!global.__resend) {
    global.__resend = new Resend(key)
  }

  return global.__resend
}

export function getResendFrom() {
  const from = process.env.RESEND_FROM
  if (!from) throw new Error('Missing env: RESEND_FROM')
  return from
}


