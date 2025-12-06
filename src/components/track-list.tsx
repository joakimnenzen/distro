'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePlayerStore } from '@/hooks/use-player-store'
import { Play, Clock } from 'lucide-react'
import { AlbumWithTracks } from '@/types/album'

export function TrackList({ album }: { album: AlbumWithTracks }) {
  const { playTrack, setQueue } = usePlayerStore()

  const handlePlayTrack = (track: AlbumWithTracks['tracks'][0]) => {
    // Set queue to all tracks from this album
    setQueue(album.tracks.map(t => ({
      id: t.id,
      title: t.title,
      file_url: t.file_url,
      duration: t.duration,
      track_number: t.track_number,
      album_id: album.id,
      album_title: album.title,
      band_name: album.bands.name,
      cover_image_url: album.cover_image_url || undefined,
    })))

    // Play the selected track
    playTrack({
      id: track.id,
      title: track.title,
      file_url: track.file_url,
      duration: track.duration,
      track_number: track.track_number,
      album_id: album.id,
      album_title: album.title,
      band_name: album.bands.name,
      cover_image_url: album.cover_image_url || undefined,
    })
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Tracks ({album.tracks.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {album.tracks
            .sort((a, b) => a.track_number - b.track_number)
            .map((track) => (
              <div
                key={track.id}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors group"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePlayTrack(track)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                >
                  <Play className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span className="text-sm text-muted-foreground w-8 text-center">
                    {track.track_number}
                  </span>
                  <span className="font-medium truncate">{track.title}</span>
                </div>

                <span className="text-sm text-muted-foreground">
                  {formatDuration(track.duration)}
                </span>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}