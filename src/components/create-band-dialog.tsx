'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createBand } from '@/actions/create-band'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Plus } from 'lucide-react'

const createBandSchema = z.object({
  name: z.string().min(1, 'Band name is required').max(100, 'Band name too long'),
  bio: z.string().max(500, 'Bio too long').optional(),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug too long').optional(),
})

type CreateBandForm = z.infer<typeof createBandSchema>

export function CreateBandDialog() {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const slugify = (value: string) => {
    return value
      .toLowerCase()
      .normalize('NFD') // split accented characters into base + diacritic
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics (ä -> a)
      .replace(/[^a-z0-9\s-]/g, '') // remove special characters
      .replace(/\s+/g, '-') // spaces -> hyphens
      .replace(/-+/g, '-') // collapse multiple hyphens
      .trim()
      .substring(0, 50)
  }

  const form = useForm<CreateBandForm>({
    resolver: zodResolver(createBandSchema),
    defaultValues: {
      name: '',
      bio: '',
      slug: '',
    },
  })

  // Auto-generate slug when name changes
  const watchedName = form.watch('name')
  const watchedSlug = form.watch('slug')

  // Update slug when name changes and slug hasn't been manually edited
  React.useEffect(() => {
    const slugDirty = !!form.formState.dirtyFields.slug

    // If user has manually edited the slug, stop auto-updating it
    if (slugDirty) return

    if (!watchedName) {
      // If name is cleared, clear slug too (but don't mark as dirty)
      if (watchedSlug) {
        form.setValue('slug', '', { shouldDirty: false })
      }
      return
    }

    const generated = slugify(watchedName)
    if (generated && generated !== watchedSlug) {
      // Set without marking slug as dirty (still considered "auto")
      form.setValue('slug', generated, { shouldDirty: false })
    }
  }, [watchedName, watchedSlug, form])

  const onSubmit = async (data: CreateBandForm) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('name', data.name)
      if (data.bio) formData.append('bio', data.bio)
      if (data.slug) formData.append('slug', data.slug)

      const result = await createBand(formData)

      if (result.success) {
        form.reset()
        setOpen(false)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New band
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Band</DialogTitle>
          <DialogDescription>
            Add a new band or artist to your collection. You can upload music and manage releases for this band.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Band Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter band name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about your band..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description of your band (max 500 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="band-url-slug" {...field} />
                  </FormControl>
                  <FormDescription>
                    URL-friendly identifier. Auto-generated from name if left empty.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Band'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
