'use client'

import { useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { resendPurchaseDownloadLink, type ResendPurchaseState } from '@/actions/resend-purchase-download-link'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-white px-4 py-2 font-mono text-sm text-black hover:bg-white/90 disabled:opacity-60"
    >
      {pending ? 'Sending…' : 'Resend'}
    </button>
  )
}

export function ResendDownloadLinkForm({
  sessionId,
  defaultEmail,
}: {
  sessionId: string
  defaultEmail: string
}) {
  const initialState: ResendPurchaseState = { status: 'idle' }
  const [state, formAction] = useFormState(resendPurchaseDownloadLink, initialState)

  // Clear success after a short while (nice UX)
  useEffect(() => {
    if (state.status !== 'success') return
    const t = window.setTimeout(() => {
      // no-op: we can't directly reset useFormState; user can resubmit or refresh
    }, 3000)
    return () => window.clearTimeout(t)
  }, [state.status])

  return (
    <form action={formAction} className="mt-3 flex gap-2">
      <input type="hidden" name="sessionId" value={sessionId} />
      <input
        name="email"
        type="email"
        required
        defaultValue={defaultEmail}
        placeholder="you@example.com"
        className="flex-1 rounded-md border border-white/20 bg-white/5 px-3 py-2 font-mono text-sm text-white placeholder:text-white/40"
      />
      <SubmitButton />

      {state.status === 'success' && (
        <span className="ml-2 self-center font-mono text-xs text-white/70">
          Sent!
        </span>
      )}
      {state.status === 'error' && (
        <span className="ml-2 self-center font-mono text-xs text-red-300">
          {state.message || 'Failed to send'}
        </span>
      )}
    </form>
  )
}


