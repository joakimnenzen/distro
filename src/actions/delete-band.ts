'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'

type DeleteBandResult = {
  success: true
} | {
  success: false
  error: string
}

export async function deleteBand(bandId: string): Promise<DeleteBandResult> {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'You must be logged in to delete a band' }
    }

    // Verify the user owns this band
    const { data: band, error: bandError } = await supabase
      .from('bands')
      .select('id, owner_id')
      .eq('id', bandId)
      .single()

    if (bandError || !band) {
      return { success: false, error: 'Band not found' }
    }

    if (band.owner_id !== user.id) {
      return { success: false, error: 'You do not have permission to delete this band' }
    }

    // Delete the band (albums and tracks will be deleted automatically via CASCADE)
    const { error: deleteError } = await supabase
      .from('bands')
      .delete()
      .eq('id', bandId)

    if (deleteError) {
      console.error('Error deleting band:', deleteError)
      return { success: false, error: 'Failed to delete band. Please try again.' }
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard')
    revalidatePath('/bands')
    revalidatePath('/', 'layout')

    return { success: true }
  } catch (error) {
    console.error('Error in deleteBand:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.' 
    }
  }
}
