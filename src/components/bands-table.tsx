'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Settings, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BandSettingsSheet } from '@/components/band-settings-sheet'

interface Band {
  id: string
  name: string
  slug: string
  bio: string | null
  image_url: string | null
  genre: string | null
  location: string | null
  albumsCount: number
  tracksCount: number
  stripe_account_id?: string | null
  stripe_payouts_enabled?: boolean | null
}

interface BandsTableProps {
  bands: Band[]
}

export function BandsTable({ bands }: BandsTableProps) {
  const [selectedBand, setSelectedBand] = useState<Band | null>(null)

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-white/5">
            <TableHead className="text-white font-sans">Band</TableHead>
            <TableHead className="text-white font-sans">Genre</TableHead>
            <TableHead className="text-white font-sans">Stats</TableHead>
            <TableHead className="text-white font-sans text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bands.map((band) => (
            <TableRow key={band.id} className="border-white/10 hover:bg-white/5">
              <TableCell>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={band.image_url || ''} alt={band.name} />
                    <AvatarFallback className="bg-white/10 text-white font-mono">
                      {band.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Link
                      href={`/band/${band.slug}`}
                      className="font-sans font-medium text-white hover:text-white/80 transition-colors"
                    >
                      {band.name}
                    </Link>
                    {band.location && (
                      <p className="text-xs text-muted-foreground font-mono">
                        {band.location}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground font-mono">
                  {band.genre || 'Not specified'}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <Music className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-mono">
                    {band.albumsCount} album{band.albumsCount !== 1 ? 's' : ''} • {band.tracksCount} track{band.tracksCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBand(band)}
                  className="text-muted-foreground hover:text-white"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedBand && (
        <BandSettingsSheet
          band={selectedBand}
          isOpen={!!selectedBand}
          onClose={() => setSelectedBand(null)}
        />
      )}
    </>
  )
}
