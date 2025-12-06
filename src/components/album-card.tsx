"use client"

import Link from 'next/link'
import Image from 'next/image'
import { Play, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface AlbumCardProps {
  album: {
    id: string
    title: string
    cover_image_url: string | null
    created_at: string
    // Allow both shapes here too
    bands: { name: string } | { name: string }[]
  }
}

export function AlbumCard({ album }: AlbumCardProps) {
  // HELPER: Safely extract the band name regardless of data shape
  const bandName = Array.isArray(album.bands) 
    ? album.bands[0]?.name 
    : album.bands?.name

  return (
    <Card className="group relative overflow-hidden bg-transparent border-0 p-0 hover:bg-transparent">
      <Link href={`/album/${album.id}`} className="block">
        <div className="aspect-square relative overflow-hidden rounded-md bg-muted">
          {album.cover_image_url ? (
            <Image
              src={album.cover_image_url}
              alt={`${album.title} cover`}
              fill
              className="object-cover transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-800">
              <Music className="w-12 h-12 text-zinc-600" />
            </div>
          )}

          {/* Play button - appears on hover */}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              size="icon"
              className="h-10 w-10 rounded-full bg-[#ff565f] hover:bg-[#ff565f]/90 shadow-lg"
              onClick={(e) => {
                e.preventDefault()
                console.log('Play album:', album.id)
              }}
            >
              <Play fill="white" className="w-4 h-4 text-white" />
            </Button>
          </div>
        </div>

        <div className="mt-3 space-y-1">
          <h3 className="font-sans font-medium truncate text-white text-sm leading-tight">
            {album.title}
          </h3>
          <p className="font-mono text-xs text-muted-foreground truncate">
            {bandName || "Unknown Artist"}
          </p>
        </div>
      </Link>
    </Card>
  )
}