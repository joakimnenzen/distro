'use client'

import React from 'react'
import { usePlayerStore } from '@/hooks/use-player-store'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface SearchTrackRowProps {
  track: {
    id: string
    title: string
    file_url: string
    duration: number | null
    track_number: number
    album_title: string
    album_cover: string | null
    band_name: string
    band_slug: string
  }
  onClick?: () => void
}

export function SearchTrackRow({ track, onClick }: SearchTrackRowProps) {
  const { playTrack, setQueue } = usePlayerStore()

  const handleClick = () => {
    // Set queue to just this track (or you could append to existing queue)
    setQueue([{
      id: track.id,
      title: track.title,
      file_url: track.file_url,
      duration: track.duration,
      track_number: track.track_number,
      album_id: '', // We don't have this from search results
      album_title: track.album_title,
      band_name: track.band_name,
      cover_image_url: track.album_cover || undefined,
    }])

    // Play the track
    playTrack({
      id: track.id,
      title: track.title,
      file_url: track.file_url,
      duration: track.duration,
      track_number: track.track_number,
      album_id: '', // We don't have this from search results
      album_title: track.album_title,
      band_name: track.band_name,
      cover_image_url: track.album_cover || undefined,
    })

    onClick?.()
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div
      className="flex items-center space-x-4 p-3 rounded-lg hover:bg-[#ff565f]/10 transition-colors group cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative w-12 h-12 flex-shrink-0">
        {track.album_cover ? (
          <Image
            src={track.album_cover}
            alt={`${track.album_title} cover`}
            fill
            className="object-cover rounded"
          />
        ) : (
          <div className="w-full h-full bg-zinc-800 rounded flex items-center justify-center">
            <div className="w-6 h-6 bg-zinc-600 rounded"></div>
          </div>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 bg-black/50 hover:bg-black/70 transition-all rounded"
        >
          <Play fill="white" className="w-4 h-4 text-white" />
        </Button>
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-mono text-white text-sm truncate">{track.title}</h4>
        <p className="font-mono text-xs text-muted-foreground truncate">
          {track.band_name} • {track.album_title}
        </p>
      </div>

      <div className="text-xs text-muted-foreground font-mono">
        {formatDuration(track.duration)}
      </div>
    </div>
  )
}
