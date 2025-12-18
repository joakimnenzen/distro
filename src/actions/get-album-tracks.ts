'use server'

import { createClient } from '@/lib/supabase-server'

export async function getAlbumTracks(albumId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('tracks')
      .select('id, title, track_number')
      .eq('album_id', albumId)
      .order('track_number', { ascending: true })

    if (error) {
      console.error('Error fetching tracks:', error)
      return { success: false, error: error.message, tracks: [] }
    }

    return { success: true, tracks: data || [] }
  } catch (error) {
    console.error('Exception in getAlbumTracks:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      tracks: []
    }
  }
}
