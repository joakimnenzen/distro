'use server'

import { createClient } from '@/lib/supabase-server'

type ActionResult =
  | { success: true }
  | { success: false; error: string }

export async function incrementTrackPlayCount(trackId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    if (!trackId) return { success: false, error: 'Missing trackId' }

    const { error } = await supabase.rpc('increment_play_count', { t_id: trackId })

    if (error) {
      console.error('[incrementTrackPlayCount] rpc error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (e) {
    console.error('[incrementTrackPlayCount] exception:', e)
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error' }
  }
}

export async function saveTrackDuration(trackId: string, durationSeconds: number): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    if (!trackId) return { success: false, error: 'Missing trackId' }
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      return { success: false, error: 'Invalid duration' }
    }

    // Best-effort: only set if currently null/0 to avoid overwriting
    const { error } = await supabase
      .from('tracks')
      .update({ duration: Math.floor(durationSeconds) })
      .eq('id', trackId)
      .or('duration.is.null,duration.eq.0')

    if (error) {
      console.error('[saveTrackDuration] update error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (e) {
    console.error('[saveTrackDuration] exception:', e)
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error' }
  }
}
