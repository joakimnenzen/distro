'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { createAlbum, createTrack, type CreateAlbumData, type CreateTrackData } from '@/actions/upload'
import { uploadCoverImage } from '@/actions/upload-cover-image'
import { createAudioUpload } from '@/actions/create-audio-upload'
import { generateAlbumZip } from '@/actions/generate-album-zip'
import { toast } from '@/hooks/use-toast'
import { BandDonateControls } from '@/components/band-donate-controls'
import { MIN_PAYMENT_SEK } from '@/lib/payments-fees'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Upload, Music, Image as ImageIcon, X, GripVertical } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const uploadFormSchema = z.object({
  title: z.string().min(1, 'Album title is required').max(200, 'Album title too long'),
  releaseDate: z.string().optional(),
  coverFile: z.instanceof(File, { message: 'Cover image is required' })
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine((file) => file.type.startsWith('image/'), 'Must be an image file'),
  trackFiles: z.array(z.instanceof(File))
    .min(1, 'At least one track is required')
    .max(50, 'Maximum 50 tracks allowed')
    .refine((files) => files.every(file => file.size <= 50 * 1024 * 1024), 'Each track must be less than 50MB')
    .refine((files) => files.every(file => file.type.startsWith('audio/')), 'All files must be audio files'),
  isPurchasable: z.boolean().optional(),
  priceSek: z.string().optional(),
})

type UploadFormData = z.infer<typeof uploadFormSchema>

interface AlbumUploadFormProps {
  bandId: string
  bandSlug: string
  bandName: string
  paymentsEnabled: boolean
}

interface FileWithId extends File {
  _id?: string
}

// Sortable File Item Component
function SortableFileItem({ file }: { file: FileWithId }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file._id || '' })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-2 bg-white/5 border border-white/10 rounded-md hover:bg-white/10 transition-colors"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-white transition-colors"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <Music className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm truncate flex-1 font-mono text-white">
        {file.name}
      </span>
      <span className="text-xs text-muted-foreground font-mono">
        {(file.size / 1024 / 1024).toFixed(1)}MB
      </span>
    </div>
  )
}

export function AlbumUploadForm({ bandId, bandSlug, bandName, paymentsEnabled }: AlbumUploadFormProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [orderedTrackFiles, setOrderedTrackFiles] = useState<FileWithId[]>([])
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient() // This is the browser client, no need to await

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      title: '',
      releaseDate: '',
      trackFiles: [],
      isPurchasable: false,
      priceSek: '50',
    },
  })

  const watchedCoverFile = form.watch('coverFile')
  const watchedTrackFiles = form.watch('trackFiles')

  // Update ordered files when form files change
  React.useEffect(() => {
    if (watchedTrackFiles && watchedTrackFiles.length > 0) {
      // Create files with unique IDs if not already set
      const filesWithIds = watchedTrackFiles.map((file, index) => {
        const fileWithId = file as FileWithId
        if (!fileWithId._id) {
          fileWithId._id = `${Date.now()}-${index}-${Math.random()}`
        }
        return fileWithId
      })
      
      // Only update if the count changed or if ordered files is empty
      // Also check if files are different by comparing names
      const currentFileNames = orderedTrackFiles.map(f => f.name).join(',')
      const newFileNames = filesWithIds.map(f => f.name).join(',')
      
      if (orderedTrackFiles.length !== filesWithIds.length || 
          orderedTrackFiles.length === 0 ||
          currentFileNames !== newFileNames) {
        setOrderedTrackFiles(filesWithIds)
      }
    } else if (orderedTrackFiles.length > 0) {
      setOrderedTrackFiles([])
    }
  }, [watchedTrackFiles]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDragStart = (event: DragStartEvent) => {
    setActiveFileId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveFileId(null)

    if (over && active.id !== over.id) {
      setOrderedTrackFiles((items) => {
        const oldIndex = items.findIndex((item) => item._id === active.id)
        const newIndex = items.findIndex((item) => item._id === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const activeFile = orderedTrackFiles.find(f => f._id === activeFileId)

  const generateUniqueFilename = (originalName: string) => {
    const extension = originalName.split('.').pop()
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    return `${timestamp}-${random}.${extension}`
  }

  const getAudioDurationSeconds = (file: File): Promise<number | null> => {
    return new Promise((resolve) => {
      try {
        const url = URL.createObjectURL(file)
        const audio = new Audio()
        audio.preload = 'metadata'
        audio.src = url

        const cleanup = () => {
          URL.revokeObjectURL(url)
          // Detach handlers to avoid leaks
          audio.onloadedmetadata = null
          audio.onerror = null
        }

        audio.onloadedmetadata = () => {
          const seconds = audio.duration
          cleanup()
          if (seconds && isFinite(seconds) && !isNaN(seconds) && seconds > 0) {
            resolve(seconds)
          } else {
            resolve(null)
          }
        }

        audio.onerror = () => {
          cleanup()
          resolve(null)
        }
      } catch {
        resolve(null)
      }
    })
  }

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw new Error(`Failed to upload ${file.name}: ${error.message}`)
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return publicUrl
  }

  const onSubmit = async (data: UploadFormData) => {
    setIsUploading(true)
    setError(null)
    setUploadProgress('Starting upload...')

    try {
      console.log('[AlbumUpload] submit start', {
        bandId,
        bandSlug,
        title: data.title,
        releaseDate: data.releaseDate,
        coverName: data.coverFile?.name,
        coverSize: data.coverFile?.size,
        trackCount: (orderedTrackFiles.length > 0 ? orderedTrackFiles : data.trackFiles)?.length,
      })

      // 1. Upload cover image
      setUploadProgress('Uploading cover image...')
      console.log("Starting cover upload...", data.coverFile.name)

      let coverUrl: string
      try {
        const coverFormData = new FormData()
        coverFormData.append('file', data.coverFile)
        coverFormData.append('bandId', bandId)

        const result = await uploadCoverImage(coverFormData)
        if (!result.success) {
          throw new Error(result.error)
        }

        coverUrl = result.publicUrl
        console.log("Cover upload success:", coverUrl)
      } catch (coverError) {
        console.error("Cover upload failed:", coverError)
        const errorMessage = coverError instanceof Error ? coverError.message : 'Failed to upload cover image'
        toast({
          title: "Upload Failed",
          description: `Cover upload error: ${errorMessage}`,
          variant: "destructive",
        })
        return // Stop the function here
      }

      // 2. Create album
      setUploadProgress('Creating album...')
      console.log('[AlbumUpload] creating album row...', { title: data.title, bandId, coverUrl })

      const wantsPurchase = Boolean(data.isPurchasable && paymentsEnabled)
      const priceSekNum = Number(data.priceSek)
      const priceOre =
        wantsPurchase && Number.isFinite(priceSekNum) && priceSekNum > 0
          ? Math.round(priceSekNum) * 100
          : undefined
      if (wantsPurchase && (!priceOre || priceOre < MIN_PAYMENT_SEK * 100)) {
        throw new Error(`Minimum price is ${MIN_PAYMENT_SEK} SEK.`)
      }

      const albumData: CreateAlbumData = {
        title: data.title,
        releaseDate: data.releaseDate,
        coverImageUrl: coverUrl,
        bandId: bandId,
        isPurchasable: wantsPurchase,
        priceOre: wantsPurchase ? priceOre : undefined,
        currency: 'sek',
      }

      const albumResult = await createAlbum(albumData)
      if (!albumResult.success) {
        throw new Error(albumResult.error)
      }

      const albumId = albumResult.albumId
      console.log('[AlbumUpload] album created', { albumId })

      // 3. Upload tracks and create track records
      // Use ordered files if available, otherwise use form files
      const tracksToUpload = orderedTrackFiles.length > 0 ? orderedTrackFiles : data.trackFiles
      setUploadProgress(`Uploading ${tracksToUpload.length} track(s)...`)
      console.log('[AlbumUpload] starting track uploads', {
        albumId,
        count: tracksToUpload.length,
        files: tracksToUpload.map((f) => ({ name: f.name, size: f.size, type: f.type })),
      })

      for (let i = 0; i < tracksToUpload.length; i++) {
        const trackFile = tracksToUpload[i]
        setUploadProgress(`Uploading track ${i + 1}/${tracksToUpload.length}: ${trackFile.name}`)
        console.log(`[AlbumUpload] track ${i + 1}/${tracksToUpload.length} start`, {
          name: trackFile.name,
          size: trackFile.size,
          type: trackFile.type,
        })

        try {
          // Upload audio file via signed upload token (avoids flaky browser auth/session)
          const trackFilename = generateUniqueFilename(trackFile.name)
          console.log(`[AlbumUpload] track ${i + 1} requesting signed upload`, {
            bandId,
            albumId,
            filename: trackFilename,
          })

          // Get duration from file metadata (best-effort)
          console.log(`[AlbumUpload] track ${i + 1} reading duration metadata...`)
          const durationSeconds = await getAudioDurationSeconds(trackFile)
          console.log(`[AlbumUpload] track ${i + 1} duration metadata`, { durationSeconds })

          const signed = await createAudioUpload({ bandId, albumId, filename: trackFilename })
          if (!signed.success) {
            console.error(`[AlbumUpload] track ${i + 1} createAudioUpload failed`, signed)
            throw new Error(`Failed to start upload: ${signed.error}`)
          }

          console.log(`[AlbumUpload] track ${i + 1} got signed token`, {
            path: signed.path,
            tokenLength: signed.token?.length,
            signedUrlLength: signed.signedUrl?.length,
          })

          console.log(`[AlbumUpload] track ${i + 1} uploading to storage...`, { path: signed.path })

          // Use fetch() with signedUrl for max reliability and better status logging
          const timeoutMs = 10 * 60_000 // 10 minutes
          const controller = new AbortController()
          const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

          let res: Response
          try {
            res = await fetch(signed.signedUrl, {
              method: 'PUT',
              body: trackFile,
              headers: {
                'Content-Type': trackFile.type || 'application/octet-stream',
              },
              signal: controller.signal,
            })
          } catch (e) {
            const aborted = controller.signal.aborted
            throw new Error(
              aborted
                ? `Audio upload timed out after ${timeoutMs / 1000}s`
                : e instanceof Error
                  ? e.message
                  : 'Audio upload failed'
            )
          } finally {
            window.clearTimeout(timeoutId)
          }

          console.log(`[AlbumUpload] track ${i + 1} upload response`, {
            ok: res.ok,
            status: res.status,
            statusText: res.statusText,
          })

          if (!res.ok) {
            const text = await res.text().catch(() => '')
            console.error(`[AlbumUpload] track ${i + 1} upload failed body`, text)
            throw new Error(`Audio upload failed (${res.status}): ${text || res.statusText}`)
          }

          console.log(`[AlbumUpload] track ${i + 1} upload complete`, { path: signed.path })

          const {
            data: { publicUrl: trackUrl },
          } = supabase.storage.from('audio').getPublicUrl(signed.path)

          console.log(`[AlbumUpload] track ${i + 1} public URL`, { trackUrl })

          // Create track record
          const trackData: CreateTrackData = {
            title: trackFile.name.replace(/\.[^/.]+$/, ''), // Remove extension for title
            fileUrl: trackUrl,
            duration: durationSeconds ? Math.floor(durationSeconds) : undefined,
            trackNumber: i + 1,
            albumId: albumId,
          }

          console.log("Submitting track:", { title: trackData.title, track_number: trackData.trackNumber })
          const trackResult = await createTrack(trackData)
          if (!trackResult.success) {
            console.error(`[AlbumUpload] track ${i + 1} db insert failed`, trackResult.error)
            throw new Error(trackResult.error || 'Failed to create track row')
          }

          console.log(`[AlbumUpload] track ${i + 1} db row created`, { trackId: trackResult.trackId })
        } catch (trackErr) {
          const message =
            trackErr instanceof Error ? trackErr.message : 'Unknown track upload error'
          console.error(`[AlbumUpload] track ${i + 1} failed`, trackErr)
          toast({
            title: `Track ${i + 1} failed`,
            description: `${trackFile.name}: ${message}`,
            variant: 'destructive',
          })
          // Stop the whole flow so we don't silently create albums without songs.
          throw trackErr
        }
      }

      // 4. If digital sales enabled, generate ZIP for download delivery
      if (wantsPurchase) {
        setUploadProgress('Creating ZIP for digital purchase...')
        const zipRes = await generateAlbumZip(albumId)
        if (!zipRes.success) {
          toast({
            title: 'ZIP generation failed',
            description: zipRes.error,
            variant: 'destructive',
          })
        }
      }

      setUploadProgress('Upload complete! Redirecting...')
      console.log('[AlbumUpload] done, redirecting', { to: `/${bandSlug}` })
      router.push(`/${bandSlug}`)
      router.refresh()

    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsUploading(false)
      setUploadProgress('')
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload New Album
        </CardTitle>
        <CardDescription>
          Add a new album to your band with cover art and tracks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Album Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter album title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="releaseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Release Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field} 
                      className="[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100"
                    />
                  </FormControl>
                  <FormDescription>
                    Optional release date for the album
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coverFile"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Cover Image *</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => onChange(e.target.files?.[0] || undefined)}
                        {...field}
                      />
                      {watchedCoverFile && (
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                          <ImageIcon className="w-4 h-4" />
                          <span className="text-sm">{watchedCoverFile.name}</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {(watchedCoverFile.size / 1024 / 1024).toFixed(1)}MB
                          </span>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload a cover image (max 5MB, JPG/PNG/WebP)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trackFiles"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Audio Tracks *</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="audio/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || [])
                          onChange(files)
                        }}
                        {...field}
                      />
                      {orderedTrackFiles.length > 0 && (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext
                            items={orderedTrackFiles.map(f => f._id || '')}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {orderedTrackFiles.map((file) => (
                                <SortableFileItem key={file._id} file={file} />
                              ))}
                            </div>
                          </SortableContext>
                          <DragOverlay>
                            {activeFile ? (
                              <div className="flex items-center gap-3 p-3 bg-white/10 border border-white/20 rounded-md shadow-lg">
                                <GripVertical className="w-4 h-4 text-white" />
                                <Music className="w-4 h-4 text-white" />
                                <span className="text-sm truncate flex-1 font-mono text-white">
                                  {activeFile.name}
                                </span>
                                <span className="text-xs text-muted-foreground font-mono">
                                  {(activeFile.size / 1024 / 1024).toFixed(1)}MB
                                </span>
                              </div>
                            ) : null}
                          </DragOverlay>
                        </DndContext>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload audio files (max 50MB each, MP3/WAV/FLAC). Drag to reorder tracks.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Digital sales (optional) */}
            <div className="rounded-lg border border-white/10 bg-black/30 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-white font-sans">Sell as Digital Download</Label>
                  <p className="text-xs font-mono text-white/50">
                    Generates a secure ZIP file for buyers. You set the price.
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="isPurchasable"
                  render={({ field }) => (
                    <Switch
                      checked={Boolean(field.value)}
                      onCheckedChange={(checked) => field.onChange(checked)}
                      disabled={!paymentsEnabled}
                      className="data-[state=checked]:bg-[#ff565f]"
                    />
                  )}
                />
              </div>

              {!paymentsEnabled && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-mono text-white/60">
                    Connect to Stripe to enable digital sales for this album.
                  </p>
                  <BandDonateControls
                    bandId={bandId}
                    bandName={bandName}
                    donationsEnabled={false}
                    isOwner={true}
                  />
                </div>
              )}

              {form.watch('isPurchasable') && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="priceSek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (SEK)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={MIN_PAYMENT_SEK}
                              step={1}
                              {...field}
                              className="bg-white/5 border-white/20 text-white font-mono"
                            />
                          </FormControl>
                          <FormDescription>Stored as öre in the database.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}

            {uploadProgress && (
              <div className="p-3 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md">
                {uploadProgress}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/${bandSlug}`)}
                disabled={isUploading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading ? 'Uploading...' : 'Upload Album'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
