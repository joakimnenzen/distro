'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Settings, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlbumSettingsSheet } from '@/components/album-settings-sheet'

interface Album {
  id: string
  title: string
  cover_image_url: string | null
  release_date?: string | null
  created_at: string
  band_id: string
  band_name: string
  band_slug: string
  tracksCount: number
  is_purchasable?: boolean
  price_ore?: number | null
}

interface AlbumsTableProps {
  albums: Album[]
}

export function AlbumsTable({ albums }: AlbumsTableProps) {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    } catch {
      return '--'
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-white/5">
            <TableHead className="text-white font-sans w-16">Cover</TableHead>
            <TableHead className="text-white font-sans">Title</TableHead>
            <TableHead className="text-white font-sans">Band</TableHead>
            <TableHead className="text-white font-sans">Tracks</TableHead>
            <TableHead className="text-white font-sans">Date</TableHead>
            <TableHead className="text-white font-sans text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {albums.map((album) => (
            <TableRow key={album.id} className="border-white/10 hover:bg-white/5">
              <TableCell>
                {album.cover_image_url ? (
                  <div className="relative w-12 h-12 rounded overflow-hidden">
                    <Image
                      src={album.cover_image_url}
                      alt={album.title}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded bg-white/10 flex items-center justify-center">
                    <Music className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Link
                  href={`/album/${album.id}`}
                  className="font-sans font-medium text-white hover:text-white/80 transition-colors"
                >
                  {album.title}
                </Link>
              </TableCell>
              <TableCell>
                <Link
                  href={`/band/${album.band_slug}`}
                  className="text-sm text-muted-foreground hover:text-white hover:underline transition-colors font-mono"
                >
                  {album.band_name}
                </Link>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground font-mono">
                  {album.tracksCount} track{album.tracksCount !== 1 ? 's' : ''}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground font-mono">
                  {formatDate(album.created_at)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAlbum(album)}
                  className="text-muted-foreground hover:text-white"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedAlbum && (
        <AlbumSettingsSheet
          album={selectedAlbum}
          isOpen={!!selectedAlbum}
          onClose={() => setSelectedAlbum(null)}
        />
      )}
    </>
  )
}
