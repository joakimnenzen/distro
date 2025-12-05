'use client'

import React, { useRef, useState, useEffect } from 'react'
import { usePlayerStore } from '@/hooks/use-player-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { RetroVisualizer } from '@/components/retro-visualizer'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'

export function Player() {
  const audioRef = useRef<HTMLAudioElement>(null)
  
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isDragging, setIsDragging] = useState(false)
  const [previousVolume, setPreviousVolume] = useState(0.7)

  const {
    isPlaying,
    currentTrack,
    queue,
    togglePlay,
    playNext,
    playPrevious
  } = usePlayerStore()

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
    }
    
    // Auto-play if supposed to be playing
    if (isPlaying) audio.play().catch(e => console.error(e))
  }

  const onTimeUpdate = () => {
    if (!audioRef.current || isDragging) return
    setCurrentTime(audioRef.current.currentTime)
  }

  const onEnded = () => {
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

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!currentTrack) return null

  return (
    <Card className="fixed bottom-0 left-0 right-0 z-50 rounded-none border-x-0 border-b-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center p-4 gap-6 container max-w-screen-xl mx-auto">
        
        {/* THE AUDIO ELEMENT - No crossOrigin, using Props */}
        <audio
          ref={audioRef}
          src={currentTrack.file_url}
          preload="metadata"
          onLoadedMetadata={onLoadedMetadata}
          onTimeUpdate={onTimeUpdate}
          onEnded={onEnded}
          onError={onError} // <--- This catches the silent errors
        />

        {/* Left: Info */}
        <div className="flex items-center space-x-4 w-1/3 min-w-0">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium truncate text-sm">{currentTrack.title}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {currentTrack.band_name}
              </p>
            </div>
            <RetroVisualizer isPlaying={isPlaying} />
          </div>
        </div>

        {/* Center: Controls */}
        <div className="flex flex-col items-center space-y-2 w-1/3 max-w-md">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={playPrevious} disabled={queue.length <= 1}>
              <SkipBack className="w-5 h-5" />
            </Button>
            <Button size="icon" onClick={togglePlay} className="h-10 w-10 rounded-full shadow-md">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
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
  )
}