'use client'

import { useMemo, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { HeartHandshake } from 'lucide-react'
import { createDonationCheckout } from '@/actions/create-donation-checkout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { MIN_PAYMENT_SEK } from '@/lib/payments-fees'

const PRESETS_SEK = [25, 50, 100, 200] as const

function DonateSubmitButton({ amountSek }: { amountSek: number }) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-[#ff565f] hover:bg-[#ff565f]/80 text-black disabled:opacity-70"
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Spinner className="text-black" />
          Redirecting…
        </span>
      ) : (
        <>Continue to Stripe Checkout ({amountSek} SEK)</>
      )}
    </Button>
  )
}

export function DonateDialog({
  bandId,
  bandName,
  disabled,
}: {
  bandId: string
  bandName: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<number>(50)
  const [custom, setCustom] = useState<string>('')

  const amountSek = useMemo(() => {
    const customNum = Number(custom)
    if (Number.isFinite(customNum) && custom.trim() !== '') {
      return Math.max(MIN_PAYMENT_SEK, Math.floor(customNum))
    }
    return selected
  }, [custom, selected])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={disabled}
          className="bg-[#ff565f] hover:bg-[#ff565f]/80 text-black"
        >
          <HeartHandshake className="w-4 h-4 mr-2" />
          Support
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-black border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="font-sans">Support {bandName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="font-mono text-xs text-white/70">Pick an amount (SEK)</Label>
            <div className="grid grid-cols-4 gap-2">
              {PRESETS_SEK.map((v) => (
                <Button
                  key={v}
                  type="button"
                  variant={selected === v && custom.trim() === '' ? 'default' : 'outline'}
                  className={
                    selected === v && custom.trim() === ''
                      ? 'bg-white text-black hover:bg-white/90'
                      : 'border-white/20 text-white hover:bg-white/10'
                  }
                  onClick={() => {
                    setSelected(v)
                    setCustom('')
                  }}
                >
                  {v}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customAmount" className="font-mono text-xs text-white/70">
              Or enter custom amount
            </Label>
            <Input
              id="customAmount"
              inputMode="numeric"
              placeholder="e.g. 75"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className="bg-white/5 border-white/20 text-white font-mono"
            />
          </div>

          <form action={createDonationCheckout} className="pt-2">
            <input type="hidden" name="bandId" value={bandId} />
            <input type="hidden" name="amountSek" value={amountSek} />
            <DonateSubmitButton amountSek={amountSek} />
            <p className="mt-2 text-xs text-white/50 font-mono">
              Minimum {MIN_PAYMENT_SEK} SEK. Secure payment via Stripe. Fees: Stripe (1.5% + 1.80 SEK) + Distro (5% + 0.50 SEK).
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}


