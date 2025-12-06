import { useAudioStore } from '@/lib/stores/audio-store'
import { create } from 'zustand'

interface Track {
  id: string
  title: string
  file_url: string
  duration: number | null
  track_number: number
  album_id: string
  album_title: string
  band_name: string
  cover_image_url?: string
}

interface PlayerState {
  isPlaying: boolean
  currentTrack: Track | null
  queue: Track[]
  isExpanded: boolean
}

interface PlayerActions {
  playTrack: (track: Track) => void
  setQueue: (tracks: Track[]) => void
  togglePlay: () => void
  playNext: () => void
  playPrevious: () => void
  setExpanded: (expanded: boolean) => void
}

type PlayerStore = PlayerState & PlayerActions

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  // Initial state
  isPlaying: false,
  currentTrack: null,
  queue: [],
  isExpanded: false,

  // Actions
  playTrack: (track) => {
    const state = get()
    set({
      currentTrack: track,
      isPlaying: true,
      queue: state.queue.length > 0 ? state.queue : [track]
    })
  },

  setQueue: (tracks) => {
    set({ queue: tracks })
  },

  togglePlay: () => {
    set((state) => ({ isPlaying: !state.isPlaying }))
  },

  playNext: () => {
    const state = get()
    if (state.queue.length === 0) return

    const currentIndex = state.queue.findIndex(t => t.id === state.currentTrack?.id)
    let nextIndex = currentIndex + 1

    if (nextIndex >= state.queue.length) {
      nextIndex = 0 // Loop back to start
    }

    const nextTrack = state.queue[nextIndex]
    set({
      currentTrack: nextTrack,
      isPlaying: true
    })
  },

  playPrevious: () => {
    const state = get()
    if (state.queue.length === 0) return

    const currentIndex = state.queue.findIndex(t => t.id === state.currentTrack?.id)
    let prevIndex = currentIndex - 1

    if (prevIndex < 0) {
      prevIndex = state.queue.length - 1 // Loop to end
    }

    const prevTrack = state.queue[prevIndex]
    set({
      currentTrack: prevTrack,
      isPlaying: true
    })
  },

  setExpanded: (expanded) => {
    set({ isExpanded: expanded })
  }
}))

// Also export the existing audio store for backward compatibility
export { useAudioStore }
