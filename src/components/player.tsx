'use client'

import React, { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePlayerStore } from '@/hooks/use-player-store'
import { createClient } from '@/lib/supabase-browser'
import { formatTime } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { incrementTrackPlayCount, saveTrackDuration } from '@/actions/track-metrics'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { RetroVisualizer } from '@/components/retro-visualizer'
import { LikeButton } from '@/components/like-button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTrigger,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'

export function Player() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const supabase = createClient()
  const router = useRouter()

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isDragging, setIsDragging] = useState(false)
  const [previousVolume, setPreviousVolume] = useState(0.7)
  const hasRecordedPlay = useRef(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const {
    isPlaying,
    currentTrack,
    queue,
    togglePlay,
    playNext,
    playPrevious
  } = usePlayerStore()

  // Reset play count tracking when track changes
  useEffect(() => {
    hasRecordedPlay.current = false
  }, [currentTrack?.id])

  // 1. Handle Play/Pause & Volume (Sync React state to DOM)
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = volume

    if (isPlaying && !isDragging) {
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise.catch(err => console.log('Play interrupted:', err))
      }
    } else {
      audio.pause()
    }
  }, [isPlaying, volume, isDragging])

  // 2. Event Handlers (Directly used in JSX)
  const onLoadedMetadata = () => {
    const audio = audioRef.current
    if (!audio) return
    
    console.log("🎵 Metadata Loaded! Duration:", audio.duration) // Debug Log
    const seconds = audio.duration
    if (seconds && !isNaN(seconds) && isFinite(seconds)) {
      setDuration(seconds)

      // Self-heal missing duration in DB
      if (currentTrack && (!currentTrack.duration || currentTrack.duration <= 0) && seconds > 0) {
        const floored = Math.floor(seconds)
        ;(async () => {
          try {
            console.log('[Player] saving duration via server action', { trackId: currentTrack.id, floored })
            const res = await saveTrackDuration(currentTrack.id, floored)
            if (!res.success) {
              console.error('[Player] saveTrackDuration failed', res.error)
              return
            }
            console.log('[Player] saveTrackDuration success', { trackId: currentTrack.id, floored })

            // Update local state to reflect the new duration
            usePlayerStore.setState((state) => ({
              currentTrack:
                state.currentTrack && state.currentTrack.id === currentTrack.id
                  ? { ...state.currentTrack, duration: floored }
                  : state.currentTrack,
              queue: state.queue.map((t) =>
                t.id === currentTrack.id ? { ...t, duration: floored } : t
              ),
            }))
          } catch (err) {
            console.error('❌ Unexpected error auto-saving duration:', err)
          }
        })()
      }
    }
    
    // Auto-play if supposed to be playing
    if (isPlaying) audio.play().catch(e => console.error(e))
  }

  const onTimeUpdate = () => {
    if (!audioRef.current || isDragging) return

    const newTime = audioRef.current.currentTime
    setCurrentTime(newTime)

    // Check if we should record a play count (30+ seconds listened)
    // Record for all users (authenticated and guests)
    if (currentTrack && isPlaying && newTime > 30 && !hasRecordedPlay.current) {
      hasRecordedPlay.current = true // Set immediately to prevent spam

      // Fire and forget - don't block UI updates
      ;(async () => {
        try {
          console.log('[Player] increment play_count via server action (30s threshold)', { trackId: currentTrack.id })
          const res = await incrementTrackPlayCount(currentTrack.id)
          if (!res.success) {
            console.error('[Player] incrementTrackPlayCount failed', res.error)
            hasRecordedPlay.current = false
            return
          }
          console.log('[Player] incrementTrackPlayCount success', { trackId: currentTrack.id })

          // Optimistically bump play_count in the in-memory queue/currentTrack
          usePlayerStore.setState((state) => ({
            currentTrack:
              state.currentTrack && state.currentTrack.id === currentTrack.id
                ? { ...state.currentTrack, play_count: (state.currentTrack.play_count || 0) + 1 }
                : state.currentTrack,
            queue: state.queue.map((t) =>
              t.id === currentTrack.id ? { ...t, play_count: (t.play_count || 0) + 1 } : t
            ),
          }))

          // Refresh current route so server-rendered play counts update (best-effort)
          router.refresh()
        } catch (error) {
          console.error('[Player] increment_play_count RPC exception', error)
          hasRecordedPlay.current = false // Reset on error so it can retry
        }
      })()
    }
  }

  const onEnded = () => {
    // Record play count for short songs that ended before 30 seconds
    // Record for all users (authenticated and guests)
    if (currentTrack && !hasRecordedPlay.current && duration > 0) {
      // For short songs, consider it played if user listened to at least 50%
      const percentageListened = (currentTime / duration) * 100
      if (percentageListened >= 50) {
        hasRecordedPlay.current = true // Set immediately

        // Fire and forget - don't block autoplay
        ;(async () => {
          try {
            console.log('[Player] increment play_count via server action (ended/50%)', { trackId: currentTrack.id })
            const res = await incrementTrackPlayCount(currentTrack.id)
            if (!res.success) {
              console.error('[Player] incrementTrackPlayCount failed (ended/50%)', res.error)
              hasRecordedPlay.current = false
              return
            }
            console.log('[Player] incrementTrackPlayCount success (ended/50%)', { trackId: currentTrack.id })

            usePlayerStore.setState((state) => ({
              currentTrack:
                state.currentTrack && state.currentTrack.id === currentTrack.id
                  ? { ...state.currentTrack, play_count: (state.currentTrack.play_count || 0) + 1 }
                  : state.currentTrack,
              queue: state.queue.map((t) =>
                t.id === currentTrack.id ? { ...t, play_count: (t.play_count || 0) + 1 } : t
              ),
            }))

            router.refresh()
          } catch (error) {
            console.error('[Player] increment_play_count RPC exception (ended/50%)', error)
            hasRecordedPlay.current = false // Reset on error
          }
        })()
      }
    }

    // Always call playNext() to maintain autoplay functionality
    playNext()
  }

  const onError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error("❌ Audio Error Event:", e.currentTarget.error) // This will tell us WHY
  }

  // 3. Slider Logic
  const handleSeek = (value: number[]) => {
    setIsDragging(true)
    setCurrentTime(value[0])
  }

  const handleSeekCommit = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0]
    }
    setIsDragging(false)
  }

  const toggleMute = () => {
    if (volume > 0) {
      setPreviousVolume(volume) // Remember the level
      setVolume(0)              // Mute it
    } else {
      setVolume(previousVolume || 0.7) // Restore it (default to 70% if lost)
    }
  }


  if (!currentTrack) return null

  const progressPct = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0

  return (
<<<<<<< HEAD
    <Card className="fixed bottom-0 left-0 right-0 z-50 rounded-none border-x-0 border-b-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center py-4 px-6 gap-6 mx-auto">
        
        {/* THE AUDIO ELEMENT - No crossOrigin, using Props */}
=======
    <>
      {/* THE AUDIO ELEMENT (shared between desktop + mobile UIs) */}
      {currentTrack.file_url && (
>>>>>>> 1cac1ad (responsive)
        <audio
          ref={audioRef}
          src={currentTrack.file_url}
          preload="metadata"
          onLoadedMetadata={onLoadedMetadata}
          onTimeUpdate={onTimeUpdate}
          onEnded={onEnded}
<<<<<<< HEAD
          onError={onError} // <--- This catches the silent errors
        />
=======
          onError={onError}
        />
      )}
>>>>>>> 1cac1ad (responsive)

      {/* Mobile: Mini player + Drawer full player */}
      <div className="md:hidden">
        <Drawer open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <DrawerTrigger asChild>
            <div
              className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] left-3 right-3 z-50 flex items-center gap-3 rounded-xl border border-white/10 bg-black/90 px-3 py-2 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-black/70"
            >
              {/* progress line */}
              <div className="absolute left-0 top-0 h-0.5 w-full overflow-hidden rounded-t-full bg-white/10">
                <div
                  className="h-full bg-white/40"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {/* cover */}
              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-sm bg-white/5">
                {currentTrack.cover_image_url ? (
                  <img
                    src={currentTrack.cover_image_url}
                    alt={`${currentTrack.album_title} cover`}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>

              {/* meta */}
              <div className="min-w-0 flex-1 text-left">
                <div className="truncate font-sans text-sm font-semibold text-white">
                  {currentTrack.title}
                </div>
                <div className="truncate text-xs text-white/60">
                  {currentTrack.band_name}
                </div>
              </div>

              {/* actions */}
              <div className="flex items-center gap-1">
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center"
                >
                  {/* Best-effort like state; server action remains source of truth */}
                  <LikeButton trackId={currentTrack.id} initialIsLiked={false} size="sm" variant="ghost" />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePlay()
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/15"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause fill="currentColor" className="h-4 w-4" />
                  ) : (
                    <Play fill="currentColor" className="h-4 w-4 ml-0.5" />
                  )}
                </button>
              </div>
            </div>
          </DrawerTrigger>

          <DrawerContent className="bg-black text-white border-white/10">
            {/* A11y: Radix Dialog requires a title (can be visually hidden) */}
            <DrawerTitle className="sr-only">Now playing</DrawerTitle>
            <DrawerDescription className="sr-only">
              Music player controls and track progress
            </DrawerDescription>

            <div className="px-5 pb-8 pt-6">
              {/* cover */}
              <div className="mx-auto w-full max-w-md">
                <div className="aspect-square w-full overflow-hidden rounded-2xl bg-white/5 shadow-lg">
                  {currentTrack.cover_image_url ? (
                    <img
                      src={currentTrack.cover_image_url}
                      alt={`${currentTrack.album_title} cover`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full" />
                  )}
                </div>
              </div>

              {/* meta + like */}
              <div className="mt-6 flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-left font-sans text-2xl font-bold">
                    {currentTrack.title}
                  </div>
                  <div className="mt-1 truncate text-left text-sm text-white/60">
                  <Link
                    href={`/band/${currentTrack.band_slug}`}
                  >
                    {currentTrack.band_name}
                    </Link>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <LikeButton trackId={currentTrack.id} initialIsLiked={false} size="default" variant="ghost" />
                </div>
              </div>

              {/* progress */}
              <div className="mt-6">
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={1}
                  onValueChange={handleSeek}
                  onValueCommit={handleSeekCommit}
                  className="w-full cursor-pointer"
                  disabled={!duration}
                />
                <div className="mt-2 flex items-center justify-between text-xs tabular-nums text-white/60">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* controls */}
              <div className="mt-8 flex items-center justify-center gap-10">
                <button
                  type="button"
                  onClick={playPrevious}
                  disabled={queue.length <= 1}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/90 disabled:opacity-40"
                  aria-label="Previous"
                >
                  <SkipBack className="h-6 w-6" />
                </button>

                <button
                  type="button"
                  onClick={togglePlay}
                  className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow-lg"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause fill="currentColor" className="h-7 w-7" />
                  ) : (
                    <Play fill="currentColor" className="h-7 w-7 ml-1" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={playNext}
                  disabled={queue.length <= 1}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/90 disabled:opacity-40"
                  aria-label="Next"
                >
                  <SkipForward className="h-6 w-6" />
                </button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Desktop: existing player */}
      <Card className="hidden md:block fixed bottom-0 left-0 right-0 z-50 rounded-none border-x-0 border-b-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center py-4 px-6 gap-6 mx-auto">
          {/* Left: Info */}
          <div className="flex items-center space-x-4 w-1/3 min-w-0">
            {/* Album Cover */}
            {currentTrack.cover_image_url && (
              <div className="flex-shrink-0">
                <img
                  src={currentTrack.cover_image_url}
                  alt={`${currentTrack.album_title} cover`}
                  className="w-14 h-14 rounded-md object-cover"
                />
              </div>
            )}
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="min-w-0 flex-1">
                <h3 className="font-mono truncate text-sm">{currentTrack.title}</h3>
                {currentTrack.band_slug ? (
                  <Link
                    href={`/band/${currentTrack.band_slug}`}
                    className="text-xs text-muted-foreground hover:text-white hover:underline transition-colors truncate"
                  >
                    {currentTrack.band_name}
                  </Link>
                ) : (
                  <p className="text-xs text-muted-foreground truncate">
                    {currentTrack.band_name}
                  </p>
                )}
              </div>
              <RetroVisualizer isPlaying={isPlaying} />
            </div>
          </div>

          {/* Center: Controls */}
          <div className="flex flex-col items-center space-y-2 w-1/3">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={playPrevious} disabled={queue.length <= 1}>
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button size="icon" onClick={togglePlay} className="h-10 w-10 rounded-full shadow-md">
                {isPlaying ? <Pause fill="currentColor" className="w-5 h-5" /> : <Play fill="currentColor" className="w-5 h-5 ml-1" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={playNext} disabled={queue.length <= 1}>
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex items-center space-x-3 w-full">
              <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
                {formatTime(currentTime)}
              </span>
              <div className="flex-1 relative py-2">
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={1}
                  onValueChange={handleSeek}
                  onValueCommit={handleSeekCommit}
                  className="w-full cursor-pointer"
                  disabled={!duration}
                />
              </div>
              <span className="text-xs text-muted-foreground w-10 tabular-nums">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Right: Volume */}
          <div className="flex items-center justify-end space-x-2 w-1/3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              {volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>

            <div className="w-24">
              <Slider
                value={[volume]}
                max={1}
                step={0.01}
                onValueChange={(val) => setVolume(val[0])}
                className="w-full cursor-pointer"
              />
            </div>
          </div>
        </div>
      </Card>
    </>
  )
}