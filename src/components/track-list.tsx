'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LikeButton } from '@/components/like-button'
import { usePlayerStore } from '@/hooks/use-player-store'
import { formatTime } from '@/lib/utils'
import { Play, Pause, Clock } from 'lucide-react'

export interface TrackListTrack {
  id: string
  title: string
  file_url: string
  duration: number | null
  track_number?: number
  play_count?: number | null
  album_id?: string
  album_title?: string
  cover_image_url?: string | null
  band_name?: string
  band_slug?: string
  liked_at?: string
}

export interface TrackListHeaderInfo {
  id: string
  title: string
  cover_image_url?: string | null
  type: 'album' | 'playlist' | 'liked'
}

export function TrackList({
  tracks,
  variant = 'album',
  hideHeader = false,
  hideDateAdded = false,
  headerInfo,
  likedTrackIds = [],
}: {
  tracks: TrackListTrack[]
  variant?: 'album' | 'playlist'
  hideHeader?: boolean
  hideDateAdded?: boolean
  headerInfo?: TrackListHeaderInfo
  likedTrackIds?: string[]
}) {
  const { playTrack, setQueue, isPlaying, currentTrack, togglePlay } = usePlayerStore()

  const normalized = tracks
    .filter((t) => t?.id && t.id.trim() !== '')
    .sort((a, b) => {
      if (variant !== 'album') return 0
      const an = typeof a.track_number === 'number' ? a.track_number : 0
      const bn = typeof b.track_number === 'number' ? b.track_number : 0
      return an - bn
    })

  const queueTracks = normalized.map((t) => ({
    id: t.id,
    title: t.title,
    file_url: t.file_url,
    duration: t.duration,
    play_count: t.play_count ?? null,
    track_number: t.track_number ?? 0,
    album_id: t.album_id ?? headerInfo?.id ?? '',
    album_title: t.album_title ?? headerInfo?.title ?? '',
    band_name: t.band_name ?? '',
    band_slug: t.band_slug,
    cover_image_url: t.cover_image_url ?? headerInfo?.cover_image_url ?? undefined,
  }))

  const isCurrentContext = Boolean(
    headerInfo &&
      ((variant === 'album' && currentTrack?.album_id === headerInfo.id) ||
        (variant === 'playlist' && queueTracks.some((t) => t.id === currentTrack?.id)))
  )

  const handlePlayContext = () => {
    if (isCurrentContext) {
      togglePlay()
      return
    }
    setQueue(queueTracks)
    if (queueTracks.length > 0) playTrack(queueTracks[0])
  }

  const handlePlayTrack = (trackId: string) => {
    const isCurrentTrack = currentTrack?.id === trackId
    if (isCurrentTrack) {
      togglePlay()
      return
    }
    const next = queueTracks.find((t) => t.id === trackId)
    if (!next) return
    setQueue(queueTracks)
    playTrack(next)
  }

  const formatDateAdded = (dateString: string | undefined) => {
    if (!dateString) return '--'
    const d = new Date(dateString)
    if (Number.isNaN(d.getTime())) return '--'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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

            {headerInfo && <CardTitle className="text-white font-sans">{headerInfo.title}</CardTitle>}
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0">
        <Table>
          <TableHeader className="hidden md:table-header-group">
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-white font-sans w-12 hidden md:table-cell">
                {variant === 'album' ? '#' : ''}
              </TableHead>
              <TableHead className="text-white font-sans w-full">Title</TableHead>
              {variant === 'playlist' && (
                <>
                  <TableHead className="text-white font-sans hidden md:table-cell">Album</TableHead>
                  {!hideDateAdded && (
                    <TableHead className="text-white font-sans hidden md:table-cell">Date Added</TableHead>
                  )}
                </>
              )}
              {variant === 'album' && (
                <TableHead className="text-white font-sans hidden md:table-cell">Plays</TableHead>
              )}
              <TableHead className="text-white font-sans text-right hidden md:table-cell">
                <Clock className="w-4 h-4 inline" />
              </TableHead>
              <TableHead className="text-white font-sans w-12" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {normalized.map((t, index) => {
              const isCurrentTrack = currentTrack?.id === t.id
              const initialIsLiked = likedTrackIds.includes(t.id)

              const albumTitle = t.album_title
              const albumId = t.album_id

              return (
                <TableRow
                  key={t.id}
                  className={`${isCurrentTrack ? 'bg-white/5' : 'border-white/10 hover:bg-white/5'} group cursor-pointer`}
                  onClick={() => handlePlayTrack(t.id)}
                >
                  <TableCell className="text-muted-foreground font-mono text-sm hidden md:table-cell py-4 w-12 text-center">
                    {isCurrentTrack ? (
                      isPlaying ? (
                        <Pause fill="currentColor" className="w-4 h-4 text-white" />
                      ) : (
                        <Play fill="currentColor" className="w-4 h-4 text-white" />
                      )
                    ) : (
                      <>
                        <span className="inline-flex w-6 items-center justify-center group-hover:hidden">
                          {variant === 'album' ? t.track_number : index + 1}
                        </span>
                        <span className="hidden w-6 items-center justify-center group-hover:inline-flex">
                          <Play fill="currentColor" className="w-4 h-4 text-white" />
                        </span>
                      </>
                    )}
                  </TableCell>

                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col min-w-0">
                        <span className={`font-sans text-sm truncate ${isCurrentTrack ? 'text-white' : 'text-white'}`}>
                          {t.title}
                        </span>
                        {variant === 'playlist' && t.band_name ? (
                          <span className="text-xs text-white/60 truncate">{t.band_name}</span>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>

                  {variant === 'playlist' && (
                    <>
                      <TableCell className="text-white/70 font-mono text-xs hidden md:table-cell">
                        {albumId && albumTitle ? (
                          <Link href={`/album/${albumId}`} className="hover:underline">
                            {albumTitle}
                          </Link>
                        ) : (
                          '--'
                        )}
                      </TableCell>

                      {!hideDateAdded && (
                        <TableCell className="text-white/70 font-mono text-xs hidden md:table-cell">
                          {formatDateAdded(t.liked_at)}
                        </TableCell>
                      )}
                    </>
                  )}

                  {variant === 'album' && (
                    <TableCell className="text-white/70 font-mono text-xs hidden md:table-cell">
                      {(t.play_count ?? 0).toLocaleString()}
                    </TableCell>
                  )}

                  <TableCell className="text-white/70 font-mono text-xs text-right hidden md:table-cell">
                    {formatTime(t.duration ?? 0)}
                  </TableCell>

                  <TableCell className="py-4 text-right">
                    <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
                      <LikeButton trackId={t.id} initialIsLiked={initialIsLiked} size="sm" variant="ghost" />
                    </div>
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


