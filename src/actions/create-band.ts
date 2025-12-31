'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'
import { isReservedBandSlug } from '@/lib/reserved-slugs'
import { slugify } from '@/lib/slug'

const createBandSchema = z.object({
  name: z.string().min(1, 'Band name is required').max(100, 'Band name too long'),
  bio: z.string().max(500, 'Bio too long').optional(),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug too long').optional(),
})

type CreateBandResult = {
  success: true
  band: {
    id: string
    name: string
    slug: string
    bio: string | null
  }
} | {
  success: false
  error: string
}

export async function createBand(formData: FormData): Promise<CreateBandResult> {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'You must be logged in to create a band' }
    }

    // Parse and validate form data
    const rawData = {
      name: formData.get('name')?.toString() || '',
      bio: formData.get('bio')?.toString() || undefined,
      slug: formData.get('slug')?.toString() || undefined,
    }

    const validatedData = createBandSchema.parse(rawData)

    // Generate slug if not provided
    const desired = validatedData.slug ?? validatedData.name
    let slug = slugify(desired, 50)

    // Ensure slug is not empty after cleaning
    if (!slug) slug = `band-${Date.now()}`

    if (isReservedBandSlug(slug)) {
      return {
        success: false,
        error: 'This band URL is reserved by Distro. Please choose a different name or slug.',
      }
    }

    // Check if slug already exists
    const { data: existingBand } = await supabase
      .from('bands')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingBand) {
      return { success: false, error: 'A band with this slug already exists. Please choose a different name or slug.' }
    }

    // Insert new band
    const { data: band, error: insertError } = await supabase
      .from('bands')
      .insert({
        name: validatedData.name,
        bio: validatedData.bio || null,
        slug: slug,
        owner_id: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating band:', insertError)
      return { success: false, error: 'Failed to create band. Please try again.' }
    }

    // Revalidate the dashboard page
    revalidatePath('/dashboard')

    return {
      success: true,
      band: {
        id: band.id,
        name: band.name,
        slug: band.slug,
        bio: band.bio,
      },
    }
  } catch (error) {
    console.error('Error in createBand:', error)

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return { success: false, error: firstError.message }
    }

    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
