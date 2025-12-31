'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'

type UpdateBandResult = {
  success: true
} | {
  success: false
  error: string
}

export async function updateBand(
  bandId: string,
  data: {
    name: string
    bio?: string | null
    genre?: string | null
    location?: string | null
    image_url?: string | null
  }
): Promise<UpdateBandResult> {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'You must be logged in to update a band' }
    }

    // Verify user owns the band and get slug for revalidation
    const { data: band, error: bandError } = await supabase
      .from('bands')
      .select('id, owner_id, slug')
      .eq('id', bandId)
      .single()

    if (bandError || !band) {
      return { success: false, error: 'Band not found' }
    }

    if (band.owner_id !== user.id) {
      return { success: false, error: 'You do not have permission to update this band' }
    }

    // Update the band
    const { error: updateError } = await supabase
      .from('bands')
      .update({
        name: data.name,
        bio: data.bio || null,
        genre: data.genre || null,
        location: data.location || null,
        image_url: data.image_url || null,
      })
      .eq('id', bandId)

    if (updateError) {
      console.error('Error updating band:', updateError)
      return { success: false, error: updateError.message || 'Failed to update band' }
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard')
    revalidatePath('/bands')
    revalidatePath(`/${band.slug}`)
    revalidatePath('/', 'layout')

    return { success: true }
  } catch (error) {
    console.error('Exception in updateBand:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}
