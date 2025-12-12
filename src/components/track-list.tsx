'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usePlayerStore } from '@/hooks/use-player-store'
<<<<<<< HEAD
=======
import { LikeButton } from '@/components/like-button'
import { formatTime } from '@/lib/utils'
>>>>>>> b3487da (duration on album page)
import { Play, Clock } from 'lucide-react'
import { AlbumWithTracks } from '@/types/album'

<<<<<<< HEAD
export function TrackList({ album }: { album: AlbumWithTracks }) {
=======
export function TrackList({ album, likedTrackIds = [], totalDuration }: {
  album: AlbumWithTracks
  likedTrackIds?: string[]
  totalDuration?: number
}) {
>>>>>>> c19dc7c (band page updates)
  const { playTrack, setQueue } = usePlayerStore()

  const handlePlayAlbum = () => {
    // Set queue to all tracks from this album
    const queueTracks = album.tracks
      .filter((track) => track.id && track.id.trim() !== '')
      .sort((a, b) => a.track_number - b.track_number)
      .map(t => ({
        id: t.id,
        title: t.title,
        file_url: t.file_url,
        duration: t.duration,
        track_number: t.track_number,
        album_id: album.id,
        album_title: album.title,
        band_name: album.bands.name,
        band_slug: album.bands.slug,
        cover_image_url: album.cover_image_url || undefined,
      }))

    setQueue(queueTracks)

    // Play the first track
    if (queueTracks.length > 0) {
      playTrack(queueTracks[0])
    }
  }

  const handlePlayTrack = (track: AlbumWithTracks['tracks'][0]) => {
    // Set queue to all tracks from this album
    const queueTracks = album.tracks
      .filter((track) => track.id && track.id.trim() !== '')
      .sort((a, b) => a.track_number - b.track_number)
      .map(t => ({
        id: t.id,
        title: t.title,
        file_url: t.file_url,
        duration: t.duration,
        track_number: t.track_number,
        album_id: album.id,
        album_title: album.title,
        band_name: album.bands.name,
        band_slug: album.bands.slug,
        cover_image_url: album.cover_image_url || undefined,
      }))

    setQueue(queueTracks)

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
      band_slug: album.bands.slug,
      cover_image_url: album.cover_image_url || undefined,
    })
  }


  const formatPlayCount = (count: number | null) => {
    if (!count) return '0'
    return count.toLocaleString()
  }

  return (
    <Card className="bg-black/20 border-white/10">
      <CardHeader className="pb-4">
        <div className="flex flex-col items-start gap-6">
          <Button
          size="icon"
          onClick={handlePlayAlbum}
          className="rounded-full shadow-md bg-[#ff565f] hover:bg-[#ff565f]/80"
          >
              <Play fill="currentColor" className="w-5 h-5 ml-1" />
            </Button>
          <CardTitle className="text-white font-sans">Tracks</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
<<<<<<< HEAD
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
=======
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-white font-sans w-12">#</TableHead>
              <TableHead className="text-white font-sans">Title</TableHead>
              <TableHead className="text-white font-sans">Plays</TableHead>
              <TableHead className="text-white font-sans text-right">
                <Clock className="w-4 h-4 inline" />
              </TableHead>
              <TableHead className="text-white font-sans w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {album.tracks
              .filter((track) => track.id && track.id.trim() !== '') // Filter out tracks with invalid IDs
              .sort((a, b) => a.track_number - b.track_number)
              .map((track) => (
                <TableRow
                  key={track.id}
                  className="border-white/10 hover:bg-white/5 group cursor-pointer"
>>>>>>> c19dc7c (band page updates)
                  onClick={() => handlePlayTrack(track)}
                >
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {track.track_number}
<<<<<<< HEAD
                  </span>
                  <span className="font-medium truncate">{track.title}</span>
                </div>

                <span className="text-sm text-muted-foreground">
                  {formatDuration(track.duration)}
                </span>
              </div>
            ))}
        </div>
=======
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-medium truncate">
                        {track.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {formatPlayCount(track.play_count)}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm text-right">
                    {track.duration ? formatTime(track.duration) : '--:--'}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <LikeButton
                      trackId={track.id}
                      initialIsLiked={likedTrackIds.includes(track.id)}
                      size="sm"
                      variant="ghost"
                    />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
>>>>>>> c19dc7c (band page updates)
      </CardContent>
    </Card>
  )
}