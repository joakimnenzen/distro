'use client'

import { useEffect, useRef } from 'react'
import { useAudioStore } from '@/lib/stores/audio-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import { Slider } from '@/components/ui/slider'

export function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setVolume,
    playNext,
    playPrevious,
    togglePlayPause,
  } = useAudioStore()

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      playNext()
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [setDuration, setCurrentTime, playNext])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return

    audio.src = currentTrack.file_url
    audio.load()
  }, [currentTrack])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.play()
    } else {
      audio.pause()
    }
  }, [isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = volume
  }, [volume])

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = value[0]
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!currentTrack) {
    return null
  }

  return (
    <Card className="fixed bottom-0 left-0 right-0 z-50 rounded-none border-x-0 border-b-0">
      <div className="flex items-center justify-between p-4">
        <audio ref={audioRef} />

        {/* Track Info */}
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium truncate">{currentTrack.title}</h3>
            <p className="text-sm text-muted-foreground truncate">
              {currentTrack.band_name} • {currentTrack.album_title}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4 flex-1 justify-center">
          <Button variant="ghost" size="icon" onClick={playPrevious}>
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="icon" onClick={togglePlayPause}>
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>

          <Button variant="ghost" size="icon" onClick={playNext}>
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress */}
        <div className="flex items-center space-x-4 flex-1 justify-end">
          <span className="text-sm text-muted-foreground w-12 text-right">
            {formatTime(currentTime)}
          </span>

          <div className="w-32">
            <Slider
              value={[currentTime]}
              max={duration || 0}
              step={1}
              onValueChange={handleSeek}
              className="w-full"
            />
          </div>

          <span className="text-sm text-muted-foreground w-12">
            {formatTime(duration)}
          </span>

          <div className="flex items-center space-x-2 w-24">
            <Volume2 className="w-4 h-4" />
            <Slider
              value={[volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </Card>
  )
}
