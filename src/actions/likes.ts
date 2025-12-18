'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'

export async function toggleLike(trackId: string) {
  console.log('[toggleLike] Called with trackId:', trackId)
  
  try {
    // Validate trackId
    if (!trackId || trackId.trim() === '') {
      console.error('[toggleLike] Invalid trackId:', trackId)
      return { success: false, error: 'Invalid Track ID' }
    }

    const supabase = await createClient()
    console.log('[toggleLike] Supabase client created')

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('[toggleLike] Auth check:', {
      hasUser: !!user,
      userId: user?.id,
      userError: userError?.message
    })
    
    if (userError || !user) {
      console.error('[toggleLike] Authentication failed:', userError)
      throw new Error('You must be logged in to like tracks')
    }

    // Check if the like already exists
    console.log('[toggleLike] Checking for existing like...')
    const { data: existingLike, error: checkError } = await supabase
      .from('user_track_likes')
      .select('user_id, track_id')
      .eq('user_id', user.id)
      .eq('track_id', trackId)
      .maybeSingle()

    console.log('[toggleLike] Existing like check:', {
      found: !!existingLike,
      checkError: checkError?.code,
      checkErrorMessage: checkError?.message
    })

    if (checkError) {
      console.error('[toggleLike] Error checking like status:', checkError)
      throw new Error(`Failed to check like status: ${checkError.message}`)
    }

    if (existingLike) {
      // Unlike: Delete the existing like
      console.log('[toggleLike] Deleting existing like...')
      const { error: deleteError } = await supabase
        .from('user_track_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('track_id', trackId)

      if (deleteError) {
        console.error('[toggleLike] Error unliking track:', deleteError)
        throw new Error(`Failed to unlike track: ${deleteError.message}`)
      }

      console.log('[toggleLike] Successfully unliked track')
      revalidatePath('/', 'layout') // Revalidate all pages that might show likes
      return { success: true, isLiked: false }
    } else {
      // Like: Insert a new like
      console.log('[toggleLike] Inserting new like...')
      const { error: insertError } = await supabase
        .from('user_track_likes')
        .insert({
          user_id: user.id,
          track_id: trackId,
        })

      if (insertError) {
        console.error('[toggleLike] Error liking track:', insertError)
        throw new Error(`Failed to like track: ${insertError.message}`)
      }

      console.log('[toggleLike] Successfully liked track')
      revalidatePath('/', 'layout') // Revalidate all pages that might show likes
      return { success: true, isLiked: true }
    }
  } catch (error) {
    console.error('[toggleLike] Exception caught:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

export async function getLikedTrackIds(userId: string): Promise<string[]> {
  try {
    const supabase = await createClient()

    const { data: likes, error } = await supabase
      .from('user_track_likes')
      .select('track_id')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching liked tracks:', error)
      return []
    }

    return likes.map(like => like.track_id)
  } catch (error) {
    console.error('Error in getLikedTrackIds:', error)
    return []
  }
}

// Define interface for the query response to avoid TS errors
interface LikedTrackRaw {
  created_at: string
  track_id: string
  tracks: {
    id: string
    title: string
    duration: number | null
    file_url: string
    albums: {
      title: string
      cover_image_url: string | null
      bands: { name: string; slug: string }[] | null
    }[] | null
  } | null
}

export async function getLikedTracks(userId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_track_likes')
      .select(`
        created_at,
        track_id,
        tracks (
          id,
          title,
          file_url,
          duration,
          album_id,
          albums (
            id,
            title,
            cover_image_url,
            bands ( name, slug )
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching liked tracks:', error)
      return []
    }

    console.log("Liked Rows Found:", data?.length)

    // The result is an array of "Like Objects", not "Track Objects"
    // Map over the data to extract and format the track information
    const formattedTracks = (data || [])
      .map((item: any) => {
        // Skip if track no longer exists (was deleted)
        if (!item.tracks) {
          console.warn('Track missing for like:', item.track_id)
          return null
        }

        // Extract album data - albums is an array from Supabase
        const album = Array.isArray(item.tracks.albums) 
          ? item.tracks.albums[0] 
          : item.tracks.albums

        // Extract band data - bands is nested inside album
        const band = Array.isArray(album?.bands)
          ? album.bands[0]
          : album?.bands

        // Debug logging in development
        if (process.env.NODE_ENV === 'development' && !album) {
          console.warn('No album found for track:', item.tracks.id, item.tracks.title)
        }
        if (process.env.NODE_ENV === 'development' && !band) {
          console.warn('No band found for track:', item.tracks.id, 'album:', album?.title)
        }

        return {
          ...item.tracks, // Spread the nested track data
          // Ensure we handle the nested relationships safely
          album_id: item.tracks.album_id || album?.id || '',
          album_title: album?.title || '',
          album_cover: album?.cover_image_url || null,
          band_name: band?.name || '',
          band_slug: band?.slug || '',
          // Also set cover_image_url for consistency
          cover_image_url: album?.cover_image_url || null,
          // Keep the liked_at timestamp if we want to show it later
          liked_at: item.created_at
        }
      })
      .filter(track => track !== null) // Remove any nulls if a track was deleted
      .filter(track => track.id && track.id.trim() !== '') // Filter out tracks with invalid IDs

    return formattedTracks
  } catch (error) {
    console.error('Error in getLikedTracks:', error)
    return []
  }
}
