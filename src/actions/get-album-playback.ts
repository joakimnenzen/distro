'use server'

import { createClient } from '@/lib/supabase-server'

type PlaybackTrack = {
  id: string
  title: string
  file_url: string
  duration: number | null
  track_number: number
}

export async function getAlbumPlaybackTracks(albumId: string): Promise<{
  success: boolean
  tracks: PlaybackTrack[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('tracks')
      .select('id, title, file_url, duration, track_number')
      .eq('album_id', albumId)
      .order('track_number', { ascending: true })

    if (error) {
      console.error('[getAlbumPlaybackTracks] Error fetching tracks:', error)
      return { success: false, tracks: [], error: error.message }
    }

    return { success: true, tracks: data || [] }
  } catch (e) {
    console.error('[getAlbumPlaybackTracks] Exception:', e)
    return {
      success: false,
      tracks: [],
      error: e instanceof Error ? e.message : 'Unexpected error',
    }
  }
}

