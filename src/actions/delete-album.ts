'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'

type DeleteAlbumResult = {
  success: true
} | {
  success: false
  error: string
}

export async function deleteAlbum(albumId: string): Promise<DeleteAlbumResult> {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'You must be logged in to delete an album' }
    }

    // Verify the user owns the album's band
    const { data: album, error: albumError } = await supabase
      .from('albums')
      .select(`
        id,
        bands!inner (
          id,
          owner_id
        )
      `)
      .eq('id', albumId)
      .single()

    if (albumError || !album) {
      return { success: false, error: 'Album not found' }
    }

    // Handle bands - can be array or single object
    const band = Array.isArray(album.bands) ? album.bands[0] : album.bands

    if (!band || band.owner_id !== user.id) {
      return { success: false, error: 'You do not have permission to delete this album' }
    }

    // Delete the album (tracks will be deleted automatically via CASCADE)
    const { error: deleteError } = await supabase
      .from('albums')
      .delete()
      .eq('id', albumId)

    if (deleteError) {
      console.error('Error deleting album:', deleteError)
      return { success: false, error: 'Failed to delete album. Please try again.' }
    }

    // Revalidate relevant paths
    revalidatePath('/albums')
    revalidatePath('/bands')
    revalidatePath('/dashboard')
    revalidatePath('/', 'layout')

    return { success: true }
  } catch (error) {
    console.error('Error in deleteAlbum:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.' 
    }
  }
}
