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
}

interface AudioState {
  currentTrack: Track | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  playlist: Track[]
  currentIndex: number
  isShuffled: boolean
  repeatMode: 'none' | 'one' | 'all'
}

interface AudioActions {
  setCurrentTrack: (track: Track | null) => void
  setIsPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  setPlaylist: (tracks: Track[]) => void
  playTrack: (track: Track, playlist?: Track[]) => void
  playNext: () => void
  playPrevious: () => void
  toggleShuffle: () => void
  toggleRepeat: () => void
  togglePlayPause: () => void
}

type AudioStore = AudioState & AudioActions

export const useAudioStore = create<AudioStore>((set, get) => ({
  // Initial state
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  playlist: [],
  currentIndex: -1,
  isShuffled: false,
  repeatMode: 'none',

  // Actions
  setCurrentTrack: (track) => set({ currentTrack: track }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setCurrentTime: (time) => set({ currentTime: time }),

  setDuration: (duration) => set({ duration }),

  setVolume: (volume) => set({ volume }),

  setPlaylist: (tracks) => set({ playlist: tracks }),

  playTrack: (track, playlist) => {
    const state = get()
    const newPlaylist = playlist || state.playlist
    const trackIndex = newPlaylist.findIndex(t => t.id === track.id)

    set({
      currentTrack: track,
      playlist: newPlaylist,
      currentIndex: trackIndex,
      isPlaying: true,
      currentTime: 0,
    })
  },

  playNext: () => {
    const state = get()
    if (state.playlist.length === 0) return

    let nextIndex = state.currentIndex + 1

    if (nextIndex >= state.playlist.length) {
      if (state.repeatMode === 'all') {
        nextIndex = 0
      } else {
        set({ isPlaying: false })
        return
      }
    }

    const nextTrack = state.playlist[nextIndex]
    set({
      currentTrack: nextTrack,
      currentIndex: nextIndex,
      isPlaying: true,
      currentTime: 0,
    })
  },

  playPrevious: () => {
    const state = get()
    if (state.playlist.length === 0) return

    let prevIndex = state.currentIndex - 1

    if (prevIndex < 0) {
      if (state.repeatMode === 'all') {
        prevIndex = state.playlist.length - 1
      } else {
        set({ currentTime: 0 })
        return
      }
    }

    const prevTrack = state.playlist[prevIndex]
    set({
      currentTrack: prevTrack,
      currentIndex: prevIndex,
      isPlaying: true,
      currentTime: 0,
    })
  },

  toggleShuffle: () => {
    set((state) => ({ isShuffled: !state.isShuffled }))
  },

  toggleRepeat: () => {
    set((state) => {
      const modes: ('none' | 'one' | 'all')[] = ['none', 'one', 'all']
      const currentIndex = modes.indexOf(state.repeatMode)
      const nextIndex = (currentIndex + 1) % modes.length
      return { repeatMode: modes[nextIndex] }
    })
  },

  togglePlayPause: () => {
    set((state) => ({ isPlaying: !state.isPlaying }))
  },
}))
