'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'
import { slugify } from '@/lib/slug'
import { MIN_PAYMENT_SEK } from '@/lib/payments-fees'

const createAlbumSchema = z.object({
  title: z.string().min(1, 'Album title is required').max(200, 'Album title too long'),
  albumType: z.enum(['album', 'ep', 'single', 'demo']).default('album'),
  releaseDate: z.string().optional(),
  coverImageUrl: z.string().url('Invalid cover image URL'),
  bandId: z.string().uuid('Invalid band ID'),
  isPurchasable: z.boolean().optional(),
  priceOre: z.number().int().min(MIN_PAYMENT_SEK * 100).optional(),
  currency: z.string().optional(),
})

const createTrackSchema = z.object({
  title: z.string().min(1, 'Track title is required').max(200, 'Track title too long'),
  fileUrl: z.string().url('Invalid file URL'),
  duration: z.number().optional(),
  trackNumber: z.number().int().min(1, 'Track number must be at least 1'),
  albumId: z.string().uuid('Invalid album ID'),
})

export type CreateAlbumData = z.infer<typeof createAlbumSchema>
export type CreateTrackData = z.infer<typeof createTrackSchema>

async function generateUniqueAlbumSlug(opts: {
  supabase: Awaited<ReturnType<typeof createClient>>
  bandId: string
  title: string
}) {
  const base = slugify(opts.title, 60) || `album-${Date.now()}`

  // Try base, then base-2, base-3, ...
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`
    const { data } = await opts.supabase
      .from('albums')
      .select('id')
      .eq('band_id', opts.bandId)
      .eq('slug', candidate)
      .maybeSingle()

    if (!data) return candidate
  }

  // Extremely unlikely fallback
  return `${base}-${Date.now()}`
}

export async function createAlbum(data: CreateAlbumData) {
  try {
    const validated = createAlbumSchema.parse(data)
    const supabase = await createClient()

    // Verify user owns the band
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('You must be logged in')
    }

    const { data: band, error: bandError } = await supabase
      .from('bands')
      .select('id')
      .eq('id', data.bandId)
      .eq('owner_id', user.id)
      .single()

    if (bandError || !band) {
      throw new Error('Band not found or access denied')
    }

    const albumSlug = await generateUniqueAlbumSlug({
      supabase,
      bandId: validated.bandId,
      title: validated.title,
    })

    // Create the album
    const { data: album, error: albumError } = await supabase
      .from('albums')
      .insert({
        title: validated.title,
        album_type: validated.albumType,
        slug: albumSlug,
        release_date: validated.releaseDate ? new Date(validated.releaseDate).toISOString().split('T')[0] : null,
        cover_image_url: validated.coverImageUrl,
        band_id: validated.bandId,
        is_purchasable: Boolean(validated.isPurchasable),
        price_ore: validated.isPurchasable ? validated.priceOre ?? null : null,
        currency: validated.currency ?? 'sek',
      })
      .select()
      .single()

    if (albumError) {
      console.error('Error creating album:', albumError)
      throw new Error('Failed to create album')
    }

    return { success: true, albumId: album.id }
  } catch (error) {
    console.error('Error in createAlbum:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

export async function createTrack(data: CreateTrackData) {
  try {
    const supabase = await createClient()

    // Create the track (RLS handles access control)
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .insert({
        title: data.title,
        file_url: data.fileUrl,
        duration: data.duration || null,
        track_number: data.trackNumber,
        album_id: data.albumId,
      })
      .select()
      .single()

    if (trackError) {
      console.error('Error creating track:', trackError)
      throw new Error(trackError.message || 'Failed to create track')
    }

    return { success: true, trackId: track.id }
  } catch (error) {
    console.log('Create Track Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}
