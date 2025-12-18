'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'

export async function toggleAlbumSave(albumId: string) {
  console.log('[toggleAlbumSave] Called with albumId:', albumId)
  
  try {
    // Validate albumId
    if (!albumId || albumId.trim() === '') {
      console.error('[toggleAlbumSave] Invalid albumId:', albumId)
      return { success: false, error: 'Invalid Album ID' }
    }

    const supabase = await createClient()
    console.log('[toggleAlbumSave] Supabase client created')

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('[toggleAlbumSave] Auth check:', {
      hasUser: !!user,
      userId: user?.id,
      userError: userError?.message
    })
    
    if (userError || !user) {
      console.error('[toggleAlbumSave] Authentication failed:', userError)
      throw new Error('You must be logged in to save albums')
    }

    // Check if the save already exists
    console.log('[toggleAlbumSave] Checking for existing save...')
    const { data: existingSave, error: checkError } = await supabase
      .from('saved_albums')
      .select('user_id, album_id')
      .eq('user_id', user.id)
      .eq('album_id', albumId)
      .maybeSingle()

    console.log('[toggleAlbumSave] Existing save check:', {
      found: !!existingSave,
      checkError: checkError?.code,
      checkErrorMessage: checkError?.message
    })

    if (checkError) {
      console.error('[toggleAlbumSave] Error checking save status:', checkError)
      throw new Error(`Failed to check save status: ${checkError.message}`)
    }

    if (existingSave) {
      // Unsave: Delete the existing save
      console.log('[toggleAlbumSave] Deleting existing save...')
      const { error: deleteError } = await supabase
        .from('saved_albums')
        .delete()
        .eq('user_id', user.id)
        .eq('album_id', albumId)

      if (deleteError) {
        console.error('[toggleAlbumSave] Error unsaving album:', deleteError)
        throw new Error(`Failed to unsave album: ${deleteError.message}`)
      }

      console.log('[toggleAlbumSave] Successfully unsaved album')
      revalidatePath('/', 'layout') // Revalidate all pages that might show saved albums
      return { success: true, isSaved: false }
    } else {
      // Save: Insert a new save
      console.log('[toggleAlbumSave] Inserting new save...')
      const { error: insertError } = await supabase
        .from('saved_albums')
        .insert({
          user_id: user.id,
          album_id: albumId,
        })

      if (insertError) {
        console.error('[toggleAlbumSave] Error saving album:', insertError)
        throw new Error(`Failed to save album: ${insertError.message}`)
      }

      console.log('[toggleAlbumSave] Successfully saved album')
      revalidatePath('/', 'layout') // Revalidate all pages that might show saved albums
      return { success: true, isSaved: true }
    }
  } catch (error) {
    console.error('[toggleAlbumSave] Exception caught:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

export async function isAlbumSaved(userId: string, albumId: string): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('saved_albums')
      .select('album_id')
      .eq('user_id', userId)
      .eq('album_id', albumId)
      .maybeSingle()

    if (error) {
      console.error('Error checking if album is saved:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Error in isAlbumSaved:', error)
    return false
  }
}

// Define interface for the query response to avoid TS errors
interface SavedAlbumRaw {
  created_at: string
  album_id: string
  albums: {
    id: string
    title: string
    cover_image_url: string | null
    release_date: string | null
    bands: {
      name: string
      slug: string
    }[] | null
  } | null
}

export async function getSavedAlbums(userId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('saved_albums')
      .select(`
        created_at,
        album_id,
        albums (
          id,
          title,
          cover_image_url,
          release_date,
          bands ( name, slug )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching saved albums:', error)
      return []
    }

    // Map over the data to extract and format the album information
    const formattedAlbums = (data || [])
      .map((item: any) => {
        // Skip if album no longer exists (was deleted)
        if (!item.albums) {
          console.warn('Album missing for save:', item.album_id)
          return null
        }

        // Extract band data - bands is an array from Supabase
        const band = Array.isArray(item.albums.bands)
          ? item.albums.bands[0]
          : item.albums.bands

        // Debug logging in development
        if (process.env.NODE_ENV === 'development' && !band) {
          console.warn('No band found for album:', item.albums.id, item.albums.title)
        }

        return {
          id: item.albums.id,
          title: item.albums.title,
          cover_image_url: item.albums.cover_image_url,
          release_date: item.albums.release_date,
          band_name: band?.name || '',
          band_slug: band?.slug || '',
          bands: band ? [band] : [],
          saved_at: item.created_at
        }
      })
      .filter(album => album !== null) // Remove any nulls if an album was deleted
      .filter(album => album.id && album.id.trim() !== '') // Filter out albums with invalid IDs

    return formattedAlbums
  } catch (error) {
    console.error('Error in getSavedAlbums:', error)
    return []
  }
}
