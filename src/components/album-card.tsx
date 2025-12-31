'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Play, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { usePlayerStore } from '@/hooks/use-player-store'
import { getAlbumPlaybackTracks } from '@/actions/get-album-playback'

interface AlbumCardProps {
  album: {
    id: string
    slug?: string
    title: string
    cover_image_url: string | null
    release_date?: string | null
    created_at?: string
    band_name?: string
    band_slug?: string
    bands?: any // Can be array or object depending on fetch
  }
  showBandName?: boolean
  subtitle?: 'band' | 'year'
}

export function AlbumCard({ album, showBandName = true, subtitle = 'band' }: AlbumCardProps) {
  const { setQueue, playTrack, togglePlay, currentTrack, isPlaying } = usePlayerStore()

  // Normalize band data - can be array or object depending on fetch
  const bandData = Array.isArray(album.bands) ? album.bands[0] : album.bands
  const bandName = bandData?.name || album.band_name || "Unknown Artist"
  const bandSlug = bandData?.slug || album.band_slug || "#"

  const albumSlug = album.slug
  const albumHref =
    bandSlug !== '#' && albumSlug ? `/${bandSlug}/${albumSlug}` : bandSlug !== '#' ? `/${bandSlug}` : '#'

  const getReleaseYear = () => {
    const dateStr = album.release_date || album.created_at
    if (!dateStr) return null
    const date = new Date(dateStr)
    const year = date.getFullYear()
    return Number.isFinite(year) ? year : null
  }

  const handlePlayAlbum = async () => {
    // If this album is already the current context, toggle play/pause
    if (currentTrack?.album_id === album.id) {
      togglePlay()
      return
    }

    const result = await getAlbumPlaybackTracks(album.id)
    if (!result.success || result.tracks.length === 0) {
      console.error('[AlbumCard] Failed to load album tracks for playback:', result.error)
      return
    }

    const queueTracks = result.tracks
      .filter((t) => t.id && t.file_url)
      .map((t) => ({
        id: t.id,
        title: t.title,
        file_url: t.file_url,
        duration: t.duration,
        track_number: t.track_number,
        album_id: album.id,
        album_title: album.title,
        band_name: bandName,
        band_slug: bandSlug !== '#' ? bandSlug : undefined,
        cover_image_url: album.cover_image_url || undefined,
      }))

    if (queueTracks.length === 0) return

    setQueue(queueTracks)
    playTrack(queueTracks[0])
  }

  return (
    <div className="relative group">
      {/* Overlay Link (entire card clickable) */}
      <Link
        href={albumHref}
        aria-label={`Open album ${album.title}`}
        className="absolute inset-0 z-10 rounded-md"
      />

      <Card className="relative overflow-hidden bg-transparent border-0 p-0 hover:bg-transparent">
        <div className="aspect-square relative overflow-hidden rounded-md bg-muted">
          {album.cover_image_url ? (
            <Image
              src={album.cover_image_url}
              alt={`${album.title} cover`}
              fill
              className="object-cover transition-all duration-300 [@media(hover:hover)]:group-hover:scale-105 [@media(hover:hover)]:group-hover:brightness-110"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-800">
              <Music className="w-12 h-12 text-zinc-600" />
            </div>
          )}

          {/* Play button - sits above overlay */}
          <div className="absolute bottom-2 right-2 z-20 opacity-100 transition-opacity duration-200 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100">
            <Button
              size="icon"
              className="relative z-20 h-10 w-10 rounded-full bg-[#ff565f] hover:bg-[#ff565f]/80"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                void handlePlayAlbum()
              }}
              aria-label={
                currentTrack?.album_id === album.id && isPlaying
                  ? 'Pause album'
                  : 'Play album'
              }
            >
              <Play fill="white" className="w-4 h-4 text-white" />
            </Button>
          </div>
        </div>

        <div className="mt-3 space-y-1">
          <h3 className="font-sans font-medium truncate text-white text-sm leading-tight">
            {album.title}
          </h3>

          {subtitle === 'year' ? (
            <span className="font-mono text-xs text-muted-foreground truncate">
              {getReleaseYear() ?? ''}
            </span>
          ) : (
            showBandName && bandSlug !== '#' && (
              <Link
                href={`/${bandSlug}`}
                className="relative z-20 inline-block font-mono text-xs text-muted-foreground hover:text-white hover:underline transition-colors truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {bandName}
              </Link>
            )
          )}
        </div>
      </Card>
    </div>
  )
}