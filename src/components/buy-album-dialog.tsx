'use client'

import { useMemo, useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { createAlbumPurchaseCheckout } from '@/actions/create-album-purchase-checkout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

function formatSekFromOre(ore: number) {
  return `${(ore / 100).toFixed(0)} SEK`
}

export function BuyAlbumDialog({
  albumId,
  albumTitle,
  priceOre,
  disabled,
}: {
  albumId: string
  albumTitle: string
  priceOre: number
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')

  const priceLabel = useMemo(() => formatSekFromOre(priceOre), [priceOre])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} variant="outline" className="border-white/20 text-white hover:bg-white/10">
          <ShoppingCart className="w-4 h-4 mr-2" />
          Buy ({priceLabel})
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-black border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="font-sans">Buy “{albumTitle}”</DialogTitle>
        </DialogHeader>

        <form action={createAlbumPurchaseCheckout} className="space-y-4">
          <input type="hidden" name="albumId" value={albumId} />

          <div className="space-y-2">
            <Label htmlFor="buyerEmail" className="font-mono text-xs text-white/70">
              Email for download link
            </Label>
            <Input
              id="buyerEmail"
              name="buyerEmail"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/5 border-white/20 text-white font-mono"
            />
          </div>

          <Button type="submit" className="w-full bg-[#ff565f] hover:bg-[#ff565f]/80 text-black">
            Continue to Stripe Checkout ({priceLabel})
          </Button>

          <p className="text-xs text-white/50 font-mono">
            We’ll email you a single-use download link after payment.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}


