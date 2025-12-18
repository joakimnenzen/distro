'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Item,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'

type Band = {
  id: string
  name: string
  slug: string
  image_url?: string | null
}

export function NewAlbumDialog({ bands }: { bands: Band[] }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  const handleSelect = (slug: string) => {
    setOpen(false)
    router.push(`/band/${slug}/upload`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Album
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] bg-black border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white font-sans">Select Band</DialogTitle>
          <DialogDescription className="text-white/60 font-mono">
            Choose which artist you want to upload an album for.
          </DialogDescription>
        </DialogHeader>

        {bands.length === 0 ? (
          <div className="rounded-md border border-white/10 bg-white/5 p-4 text-sm text-white/70 font-mono">
            You don’t have any bands yet. Create a band first.
          </div>
        ) : (
          <ItemGroup className="mt-2">
            {bands.map((band) => (
              <Item
                key={band.id}
                asChild
                size="sm"
                variant="muted"
                className="cursor-pointer hover:bg-white/10 mt-2"
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => handleSelect(band.slug)}
                >
                  <ItemMedia variant="image">
                    {band.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={band.image_url} alt={band.name} />
                    ) : (
                      <div className="h-full w-full bg-white/10 flex items-center justify-center text-xs font-mono text-white/70">
                        {band.name?.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="text-white">{band.name}</ItemTitle>
                  </ItemContent>
                </button>
              </Item>
            ))}
          </ItemGroup>
        )}
      </DialogContent>
    </Dialog>
  )
}
