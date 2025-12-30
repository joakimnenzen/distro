'use client'

import { startStripeConnectOnboarding } from '@/actions/stripe-connect'
import { DonateDialog } from '@/components/donate-dialog'
import { Button } from '@/components/ui/button'

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
  if (donationsEnabled) {
    return <DonateDialog bandId={bandId} bandName={bandName} />
  }

  if (isOwner) {
    return (
      <form action={startStripeConnectOnboarding}>
        <input type="hidden" name="bandId" value={bandId} />
        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
          Enable donations
        </Button>
      </form>
    )
  }

  return (
    <Button disabled variant="outline" className="border-white/10 text-white/50">
      Donations not enabled
    </Button>
  )
}


