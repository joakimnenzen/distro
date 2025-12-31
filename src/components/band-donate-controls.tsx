'use client'

import { useState } from 'react'
import { DonateDialog } from '@/components/donate-dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

export function BandDonateControls({
  bandId,
  bandName,
  donationsEnabled,
  isOwner,
}: {
  bandId: string
  bandName: string
  donationsEnabled: boolean
  isOwner: boolean
}) {
  const [isConnecting, setIsConnecting] = useState(false)

  if (donationsEnabled) {
    return <DonateDialog bandId={bandId} bandName={bandName} />
  }

  if (isOwner) {
    return (
      <Button
        type="button"
        onClick={() => {
          setIsConnecting(true)
          window.location.href = `/api/stripe/connect?bandId=${encodeURIComponent(bandId)}`
        }}
        disabled={isConnecting}
        variant="outline"
        className="border-white/20 text-white hover:bg-white/10 disabled:opacity-70"
      >
        {isConnecting ? (
          <span className="inline-flex items-center gap-2">
            <Spinner className="text-white" />
            Redirecting…
          </span>
        ) : (
          'Connect payouts'
        )}
      </Button>
    )
  }

  // If payouts/support isn't enabled and the viewer isn't the owner, don't show any CTA.
  return null
}

