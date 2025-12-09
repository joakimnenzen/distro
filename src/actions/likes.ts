'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'

export async function toggleLike(trackId: string) {
  try {
    // Validate trackId
    if (!trackId || trackId.trim() === '') {
      return { success: false, error: 'Invalid Track ID' }
    }

    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('You must be logged in to like tracks')
    }

    // Check if the like already exists
    const { data: existingLike, error: checkError } = await supabase
      .from('user_track_likes')
      .select('user_id, track_id')
      .eq('user_id', user.id)
      .eq('track_id', trackId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking like status:', checkError)
      throw new Error('Failed to check like status')
    }

    if (existingLike) {
      // Unlike: Delete the existing like
      const { error: deleteError } = await supabase
        .from('user_track_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('track_id', trackId)

      if (deleteError) {
        console.error('Error unliking track:', deleteError)
        throw new Error('Failed to unlike track')
      }

      revalidatePath('/', 'layout') // Revalidate all pages that might show likes
      return { success: true, isLiked: false }
    } else {
      // Like: Insert a new like
      const { error: insertError } = await supabase
        .from('user_track_likes')
        .insert({
          user_id: user.id,
          track_id: trackId,
        })

      if (insertError) {
        console.error('Error liking track:', insertError)
        throw new Error('Failed to like track')
      }

      revalidatePath('/', 'layout') // Revalidate all pages that might show likes
      return { success: true, isLiked: true }
    }
  } catch (error) {
    console.error('Error in toggleLike:', error)
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
          albums (
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
        if (!item.tracks) return null

        return {
          ...item.tracks, // Spread the nested track data
          // Ensure we handle the nested relationships safely
          band_name: item.tracks.albums?.[0]?.bands?.[0]?.name || '',
          band_slug: item.tracks.albums?.[0]?.bands?.[0]?.slug || '',
          album_title: item.tracks.albums?.[0]?.title || '',
          album_cover: item.tracks.albums?.[0]?.cover_image_url || null,
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
