'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usePlayerStore } from '@/hooks/use-player-store'
import { LikeButton } from '@/components/like-button'
import { formatTime } from '@/lib/utils'
import { Play, Pause, Clock } from 'lucide-react'

// Generic track interface that works for both album and playlist tracks
interface GenericTrack {
  id: string
  title: string
  file_url: string
  duration: number | null
  track_number?: number
  play_count?: number | null
  album_id?: string
  album_title?: string
  album_cover?: string | null // Alias for cover_image_url
  band_name?: string
  band_slug?: string
  cover_image_url?: string | null
  liked_at?: string // For playlist tracks (date added)
}

interface TrackListProps {
  tracks: GenericTrack[]
  variant?: 'album' | 'playlist'
  hideHeader?: boolean
  hideDateAdded?: boolean
  headerInfo?: {
    id: string
    title: string
    cover_image_url?: string | null
    type: 'album' | 'playlist' | 'liked'
  }
  likedTrackIds?: string[]
}

export function TrackList({ 
  tracks, 
  variant = 'album', 
  hideHeader = false,
  hideDateAdded = false,
  headerInfo,
  likedTrackIds = [] 
}: TrackListProps) {
  const { playTrack, setQueue, isPlaying, currentTrack, togglePlay } = usePlayerStore()

  // Check if this context (album/playlist) is currently playing
  const isCurrentContext = headerInfo 
    ? (variant === 'album' && currentTrack?.album_id === headerInfo.id) ||
      (variant === 'playlist' && tracks.some(t => t.id === currentTrack?.id))
    : false

  const handlePlayContext = () => {
    // If this context is already playing, toggle play/pause
    if (isCurrentContext) {
      togglePlay()
      return
    }

    // Otherwise, start playing from the beginning
    const queueTracks = tracks
      .filter((track) => track.id && track.id.trim() !== '')
      .sort((a, b) => {
        // Sort by track_number for albums, maintain order for playlists
        if (variant === 'album' && a.track_number && b.track_number) {
          return a.track_number - b.track_number
        }
        return 0
      })
      .map(t => ({
        id: t.id,
        title: t.title,
        file_url: t.file_url,
        duration: t.duration,
        track_number: t.track_number || 0,
        album_id: t.album_id || headerInfo?.id || '',
        album_title: t.album_title || headerInfo?.title || '',
        band_name: t.band_name || '',
        band_slug: t.band_slug,
        cover_image_url: t.cover_image_url || headerInfo?.cover_image_url || undefined,
      }))

    setQueue(queueTracks)

    // Play the first track
    if (queueTracks.length > 0) {
      playTrack(queueTracks[0])
    }
  }

  const handlePlayTrack = (track: GenericTrack) => {
    // Set queue to all tracks from this context
    const queueTracks = tracks
      .filter((track) => track.id && track.id.trim() !== '')
      .sort((a, b) => {
        if (variant === 'album' && a.track_number && b.track_number) {
          return a.track_number - b.track_number
        }
        return 0
      })
      .map(t => ({
        id: t.id,
        title: t.title,
        file_url: t.file_url,
        duration: t.duration,
        track_number: t.track_number || 0,
        album_id: t.album_id || headerInfo?.id || '',
        album_title: t.album_title || headerInfo?.title || '',
        band_name: t.band_name || '',
        band_slug: t.band_slug,
        cover_image_url: t.cover_image_url || headerInfo?.cover_image_url || undefined,
      }))

    setQueue(queueTracks)

    // Play the selected track
    playTrack({
      id: track.id,
      title: track.title,
      file_url: track.file_url,
      duration: track.duration,
      track_number: track.track_number || 0,
      album_id: track.album_id || headerInfo?.id || '',
      album_title: track.album_title || headerInfo?.title || '',
      band_name: track.band_name || '',
      band_slug: track.band_slug,
      cover_image_url: track.cover_image_url || headerInfo?.cover_image_url || undefined,
    })
  }


  const formatPlayCount = (count: number | null | undefined) => {
    if (!count) return '0'
    return count.toLocaleString()
  }

  const formatDateAdded = (dateString: string | undefined) => {
    if (!dateString) return '--'
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
    <Card className="bg-black/20 border-white/10">
      {!hideHeader && (
        <CardHeader className="pb-4">
          <div className="flex flex-col items-start gap-6">
            <Button
              size="icon"
              onClick={handlePlayContext}
              className="rounded-full shadow-md bg-[#ff565f] hover:bg-[#ff565f]/80"
            >
              {isCurrentContext && isPlaying ? (
                <Pause fill="currentColor" className="w-5 h-5" />
              ) : (
                <Play fill="currentColor" className="w-5 h-5 ml-1" />
              )}
            </Button>
            {headerInfo && (
              <CardTitle className="text-white font-sans">{headerInfo.title}</CardTitle>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-white font-sans w-12">#</TableHead>
              <TableHead className="text-white font-sans">Title</TableHead>
              {variant === 'playlist' && (
                <>
                  <TableHead className="text-white font-sans">Album</TableHead>
                  {!hideDateAdded && (
                    <TableHead className="text-white font-sans">Date Added</TableHead>
                  )}
                </>
              )}
              {variant === 'album' && (
                <TableHead className="text-white font-sans">Plays</TableHead>
              )}
              <TableHead className="text-white font-sans text-right">
                <Clock className="w-4 h-4 inline" />
              </TableHead>
              <TableHead className="text-white font-sans w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tracks
              .filter((track) => track.id && track.id.trim() !== '') // Filter out tracks with invalid IDs
              .sort((a, b) => {
                if (variant === 'album' && a.track_number && b.track_number) {
                  return a.track_number - b.track_number
                }
                return 0
              })
              .map((track, index) => {
                const isCurrentTrack = currentTrack?.id === track.id
                
                return (
                <TableRow
                  key={track.id}
                  className={`${isCurrentTrack ? 'bg-white/5' : 'border-white/10 hover:bg-white/5'} group cursor-pointer`}
                  onClick={() => {
                    if (isCurrentTrack) {
                      togglePlay()
                    } else {
                      handlePlayTrack(track)
                    }
                  }}
                >
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {isCurrentTrack ? (
                      isPlaying ? (
                        <Pause fill="currentColor" className="w-4 h-4 text-white" />
                      ) : (
                        <Play fill="currentColor" className="w-4 h-4 text-white" />
                      )
                    ) : (
                      <>
                        <span className="group-hover:hidden">
                          {variant === 'album' ? track.track_number : index + 1}
                        </span>
                        <Play fill="currentColor" className="w-4 h-4 text-white hidden group-hover:block" />
                      </>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {variant === 'playlist' && (track.cover_image_url || track.album_cover) && (
                      <img
                          src={track.cover_image_url || track.album_cover || undefined}
                          alt={track.album_title || 'Album cover'}
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      {variant === 'playlist' ? (
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className={`font-medium truncate ${isCurrentTrack ? 'text-[#ff565f]' : 'text-white'}`}>
                            {track.title}
                          </span>
                          {track.band_name && (
                            <Link
                              href={track.band_slug ? `/band/${track.band_slug}` : '#'}
                              className="text-xs text-muted-foreground hover:text-white hover:underline transition-colors truncate"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {track.band_name}
                            </Link>
                          )}
                        </div>
                      ) : (
                        <span className={`font-medium truncate ${isCurrentTrack ? 'text-[#ff565f]' : 'text-white'}`}>
                          {track.title}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  {variant === 'playlist' && (
                    <>
                      <TableCell>
                        {track.album_title ? (
                          <Link
                            href={track.album_id ? `/album/${track.album_id}` : '#'}
                            className="text-sm text-muted-foreground hover:text-white hover:underline transition-colors truncate"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {track.album_title}
                          </Link>
                        ) : (
                          <span className="text-sm text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      {!hideDateAdded && (
                        <TableCell className="text-muted-foreground font-mono text-sm">
                          {formatDateAdded(track.liked_at)}
                        </TableCell>
                      )}
                    </>
                  )}
                  {variant === 'album' && (
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {formatPlayCount(track.play_count)}
                    </TableCell>
                  )}
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
                )
              })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}