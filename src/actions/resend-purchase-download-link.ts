'use server'

import { z } from 'zod'
import { fulfillPurchaseFromSessionId } from '@/lib/purchase-delivery'

export type ResendPurchaseState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string }

const schema = z.object({
  sessionId: z.string().min(1),
  email: z.string().email(),
})

export async function resendPurchaseDownloadLink(
  _prevState: ResendPurchaseState,
  formData: FormData
): Promise<ResendPurchaseState> {
  const parsed = schema.safeParse({
    sessionId: formData.get('sessionId'),
    email: formData.get('email'),
  })

  if (!parsed.success) return { status: 'error', message: 'Invalid email' }

  const { sessionId, email } = parsed.data
  const result = await fulfillPurchaseFromSessionId(sessionId, { overrideEmail: email })
  if (!result.success) return { status: 'error', message: result.error }
  return { status: 'success' }
}


