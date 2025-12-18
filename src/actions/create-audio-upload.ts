'use server'

import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

type CreateAudioUploadResult =
  | { success: true; path: string; token: string; signedUrl: string }
  | { success: false; error: string }

const schema = z.object({
  bandId: z.string().uuid(),
  albumId: z.string().uuid(),
  filename: z.string().min(1),
})

export async function createAudioUpload(input: z.infer<typeof schema>): Promise<CreateAudioUploadResult> {
  try {
    const { bandId, albumId, filename } = schema.parse(input)
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'You must be logged in to upload audio' }
    }

    // Verify ownership of band (album belongs to band)
    const { data: band, error: bandError } = await supabase
      .from('bands')
      .select('id')
      .eq('id', bandId)
      .eq('owner_id', user.id)
      .single()

    if (bandError || !band) {
      return { success: false, error: 'Band not found or access denied' }
    }

    const path = `${bandId}/${albumId}/${filename}`

    const { data, error } = await supabase.storage
      .from('audio')
      .createSignedUploadUrl(path)

    // data is expected to include { token, signedUrl (or signed_url), path }
    const signedUrl = (data as any)?.signedUrl || (data as any)?.signed_url
    if (error || !data?.token || !signedUrl) {
      console.error('[createAudioUpload] createSignedUploadUrl error:', error)
      return { success: false, error: error?.message || 'Failed to create signed upload URL' }
    }

    return { success: true, path, token: data.token, signedUrl }
  } catch (e) {
    console.error('[createAudioUpload] exception:', e)
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error creating audio upload' }
  }
}
