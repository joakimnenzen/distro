'use server'

import { createClient } from '@/lib/supabase-server'

type UploadBandImageResult = {
  success: true
  imageUrl: string
} | {
  success: false
  error: string
}

export async function uploadBandImage(formData: FormData): Promise<UploadBandImageResult> {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'You must be logged in to upload images' }
    }

    const file = formData.get('file') as File
    const bandId = formData.get('bandId') as string

    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    if (!bandId) {
      return { success: false, error: 'No band ID provided' }
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return { success: false, error: `Image file is too large. Maximum size is ${(maxSize / 1024 / 1024).toFixed(0)}MB.` }
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'File must be an image' }
    }

    // Generate file path (no bucket prefix needed since we specify bucket in .from())
    const fileExt = file.name.split('.').pop()
    const fileName = `${bandId}-${Date.now()}.${fileExt}`
    const filePath = fileName

    console.log('[uploadBandImage] Uploading:', {
      fileName,
      filePath,
      fileSize: file.size,
      fileType: file.type,
      userId: user.id
    })

    // Upload to Supabase storage
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('band-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('[uploadBandImage] Upload error:', uploadError)
      
      // Check error message for specific issues
      const errorMessage = uploadError.message || ''
      
      if (errorMessage.includes('bucket') || errorMessage.includes('Bucket') || errorMessage.includes('not found')) {
        return { success: false, error: 'band-images bucket does not exist or is not accessible' }
      }
      
      if (errorMessage.includes('permission') || errorMessage.includes('policy') || errorMessage.includes('Forbidden') || errorMessage.includes('403')) {
        return { success: false, error: 'You do not have permission to upload to the band-images bucket. Please check your authentication status.' }
      }

      return { success: false, error: errorMessage || 'Failed to upload image' }
    }

    console.log('[uploadBandImage] Upload successful:', uploadData)

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('band-images')
      .getPublicUrl(filePath)

    if (!urlData?.publicUrl) {
      return { success: false, error: 'Failed to get public URL for uploaded image' }
    }

    console.log('[uploadBandImage] Public URL:', urlData.publicUrl)
    return { success: true, imageUrl: urlData.publicUrl }
  } catch (error) {
    console.error('[uploadBandImage] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred during upload'
    }
  }
}
