'use server'

import { createClient } from '@/lib/supabase-server'

type UploadCoverImageResult =
  | { success: true; publicUrl: string }
  | { success: false; error: string }

export async function uploadCoverImage(formData: FormData): Promise<UploadCoverImageResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'You must be logged in to upload cover images' }
    }

    const file = formData.get('file') as File | null
    const bandId = formData.get('bandId')?.toString()

    if (!file) return { success: false, error: 'No file provided' }
    if (!bandId) return { success: false, error: 'No band ID provided' }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return { success: false, error: `Cover image is too large. Max ${(maxSize / 1024 / 1024).toFixed(0)}MB.` }
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Cover file must be an image' }
    }

    const ext = file.name.split('.').pop() || 'png'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const path = `${bandId}/${filename}`

    const { error: uploadError } = await supabase.storage
      .from('covers')
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      console.error('[uploadCoverImage] uploadError:', uploadError)
      return { success: false, error: uploadError.message || 'Failed to upload cover image' }
    }

    const { data: urlData } = supabase.storage.from('covers').getPublicUrl(path)

    if (!urlData?.publicUrl) {
      return { success: false, error: 'Failed to get public URL for cover image' }
    }

    return { success: true, publicUrl: urlData.publicUrl }
  } catch (e) {
    console.error('[uploadCoverImage] exception:', e)
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error uploading cover image' }
  }
}
