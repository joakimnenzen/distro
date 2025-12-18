'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { useToast } from '@/hooks/use-toast'
import { deleteAlbum } from '@/actions/delete-album'
import { getAlbumTracks } from '@/actions/get-album-tracks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Upload, X, Trash2, GripVertical } from 'lucide-react'
import Image from 'next/image'
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

interface Album {
  id: string
  title: string
  cover_image_url: string | null
  band_id: string
  band_name: string
  band_slug: string
}

interface Track {
  id: string
  title: string
  track_number: number
}

interface AlbumSettingsSheetProps {
  album: Album
  isOpen: boolean
  onClose: () => void
}

export function AlbumSettingsSheet({ album, isOpen, onClose }: AlbumSettingsSheetProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [title, setTitle] = useState(album.title)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(album.cover_image_url)
  const [tracks, setTracks] = useState<Track[]>([])
  const [isLoadingTracks, setIsLoadingTracks] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const isMountedRef = useRef(true)
  const isOpenRef = useRef(isOpen)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Fetch tracks when sheet opens
  useEffect(() => {
    // Reset state when sheet closes
    if (!isOpen) {
      setTracks([])
      setIsLoadingTracks(false)
      return
    }

    // Only fetch if sheet is open and we have an album ID
    if (!album.id) {
      setIsLoadingTracks(false)
      return
    }

    // Set mounted flag
    isMountedRef.current = true
    isOpenRef.current = isOpen

    const loadTracksWithCleanup = async () => {
      setIsLoadingTracks(true)
      
      try {
        console.log('Fetching tracks for album:', album.id)
        
        // Use server action instead of direct client query
        const result = await getAlbumTracks(album.id)

        console.log('Tracks fetch result:', { 
          success: result.success,
          tracksLength: result.tracks?.length,
          error: result.error,
          isOpen: isOpenRef.current, 
          isMounted: isMountedRef.current 
        })

        // Always reset loading state
        setIsLoadingTracks(false)

        // Only update state if sheet is still open and component is mounted
        if (!isMountedRef.current || !isOpenRef.current) {
          console.log('Skipping state update - sheet closed or unmounted')
          return
        }

        if (!result.success) {
          console.error('Error fetching tracks:', result.error)
          toast({
            title: "Error",
            description: result.error || "Failed to load tracks",
            variant: "destructive",
          })
          setTracks([])
          return
        }

        console.log('Setting tracks:', result.tracks?.length || 0, 'tracks')
        setTracks(result.tracks || [])
      } catch (error) {
        console.error('Exception in fetchTracks:', error)
        // Always reset loading state, even on error
        setIsLoadingTracks(false)
        
        // Only show error if still mounted and sheet is open
        if (isMountedRef.current && isOpenRef.current) {
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to load tracks",
            variant: "destructive",
          })
          setTracks([])
        }
      }
    }

    loadTracksWithCleanup()

    // Cleanup on unmount or when sheet closes
    return () => {
      isMountedRef.current = false
    }
  }, [isOpen, album.id, toast])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      setTracks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        const newTracks = arrayMove(items, oldIndex, newIndex)
        
        // Update track numbers based on new order
        return newTracks.map((track, index) => ({
          ...track,
          track_number: index + 1,
        }))
      })
    }
  }

  const activeTrack = tracks.find(t => t.id === activeId)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${album.id}-${Date.now()}.${fileExt}`
    // Use band_id from album prop to maintain folder structure
    const filePath = album.band_id ? `${album.band_id}/${fileName}` : fileName

    console.log('Uploading image:', { fileName, filePath, bucket: 'covers', fileSize: file.size, fileType: file.type })

    // Create upload promise with timeout
    const uploadPromise = supabase.storage
      .from('covers')
      .upload(filePath, file)

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
    })

    try {
      const { error: uploadError, data: uploadData } = await Promise.race([uploadPromise, timeoutPromise]) as any

      if (uploadError) {
        console.error('Upload error:', uploadError)

        // Check for specific bucket-related errors
        if (uploadError.message?.includes('bucket') || uploadError.message?.includes('Bucket')) {
          throw new Error('covers bucket does not exist or is not accessible. Please ensure the bucket was created successfully in Supabase.')
        }

        // Check for permission errors
        if (uploadError.message?.includes('permission') || uploadError.message?.includes('policy')) {
          throw new Error('You do not have permission to upload to the covers bucket. Please check your authentication status.')
        }

        throw uploadError
      }

      console.log('Upload successful:', uploadData)

    } catch (timeoutError: any) {
      console.error('Upload timeout or error:', timeoutError)

      if (timeoutError.message.includes('timeout')) {
        throw new Error('Upload timed out. Please check your internet connection and try again.')
      }

      // Re-throw the original error if it's not a timeout
      if (timeoutError.message.includes('bucket') || timeoutError.message.includes('Bucket')) {
        throw new Error('covers bucket does not exist or is not accessible. Please ensure the bucket was created successfully in Supabase.')
      }

      throw timeoutError
    }

    // Get public URL
    try {
      const { data } = supabase.storage
        .from('covers')
        .getPublicUrl(filePath)

      if (!data?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded image')
      }

      console.log('Public URL:', data.publicUrl)
      return data.publicUrl
    } catch (urlError) {
      console.error('Error getting public URL:', urlError)
      throw new Error('Upload succeeded but failed to generate public URL')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let imageUrl = album.cover_image_url

      console.log('Starting album update process...')
      console.log('Current album data:', { id: album.id, title: album.title })
      console.log('New title:', title)
      console.log('Image file selected:', !!imageFile)

      // Upload new image if selected
      if (imageFile) {
        console.log('Uploading new image...')
        imageUrl = await uploadImage(imageFile)
        console.log('Image upload completed, new URL:', imageUrl)
      } else {
        console.log('No new image selected, keeping existing URL:', imageUrl)
      }

      // Prepare update data
      const updateData = {
        title: title,
        cover_image_url: imageUrl,
      }

      console.log('Updating album with data:', updateData)

      // Update album record
      const { error, data } = await supabase
        .from('albums')
        .update(updateData)
        .eq('id', album.id)
        .select()

      if (error) {
        console.error('Database update error:', error)
        throw error
      }

      console.log('Database update successful:', data)

      // Update track order if tracks were reordered
      if (tracks.length > 0) {
        console.log('Updating track order...')
        console.log('Tracks to update:', tracks)

        // Update each track's track_number in parallel
        const updatePromises = tracks.map((track) =>
          supabase
            .from('tracks')
            .update({ track_number: track.track_number })
            .eq('id', track.id)
        )

        const results = await Promise.all(updatePromises)
        
        // Check for any errors
        const errors = results.filter(result => result.error)
        if (errors.length > 0) {
          console.error('Error updating track order:', errors)
          const firstError = errors[0].error
          throw new Error(firstError?.message || 'Failed to update track order')
        }

        console.log('Track order updated successfully')
      }

      toast({
        title: "Success",
        description: "Album updated successfully!",
      })

      console.log('Closing sheet and refreshing...')
      onClose()
      router.refresh()

    } catch (error) {
      console.error('Error in handleSubmit:', error)

      // More specific error messages
      let errorMessage = "Failed to update album. Please try again."
      if (error instanceof Error) {
        errorMessage = error.message
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      console.log('Setting loading to false')
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const result = await deleteAlbum(album.id)

      if (result.success) {
        toast({
          title: "Success",
          description: "Album deleted successfully!",
        })
        onClose()
        router.push('/albums')
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        setShowDeleteDialog(false)
      }
    } catch (error) {
      console.error('Error deleting album:', error)
      toast({
        title: "Error",
        description: "Failed to delete album. Please try again.",
        variant: "destructive",
      })
      setShowDeleteDialog(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="bg-black border-white/10 text-white w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-white font-sans">Edit Album</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            {/* Cover Image Upload */}
            <div className="space-y-2">
              <Label className="text-white font-sans">Cover Image</Label>
              <div className="flex items-center space-x-4">
                {imagePreview ? (
                  <div className="relative w-24 h-24 rounded overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt={album.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded bg-white/10 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <Label
                    htmlFor="image-upload"
                    className="cursor-pointer inline-flex items-center px-3 py-2 border border-white/20 rounded-md text-sm font-mono text-white hover:bg-white/10 transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Label>
                  {imageFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview(album.cover_image_url)
                      }}
                      className="ml-2 text-muted-foreground hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white font-sans">Album Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white/5 border-white/20 text-white font-mono"
                required
              />
            </div>

            {/* Sortable Track List */}
            <div className="space-y-2">
              <Label className="text-white font-sans">Track Order</Label>
              {isLoadingTracks ? (
                <div className="text-sm text-muted-foreground font-mono py-4 text-center">
                  Loading tracks...
                </div>
              ) : tracks.length === 0 ? (
                <div className="text-sm text-muted-foreground font-mono py-4 text-center">
                  No tracks in this album
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={tracks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {tracks.map((track) => (
                        <SortableTrackItem key={track.id} track={track} />
                      ))}
                    </div>
                  </SortableContext>
                  <DragOverlay>
                    {activeTrack ? (
                      <div className="flex items-center gap-3 p-3 bg-white/10 border border-white/20 rounded-md shadow-lg">
                        <GripVertical className="w-4 h-4 text-white" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-mono text-white truncate block">
                            {activeTrack.title}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-muted-foreground">
                          {activeTrack.track_number}
                        </div>
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-[#ff565f] hover:bg-[#ff565f]/80 text-black"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>

            {/* Delete Button */}
            <div className="pt-6 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="w-full border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Album
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-black border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white font-sans">Delete Album</DialogTitle>
            <DialogDescription className="text-muted-foreground font-mono">
              Are you sure you want to delete &ldquo;{album.title}&rdquo;? This action cannot be undone.
              <br />
              <br />
              This will also delete all tracks associated with this album.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-white/20 text-white hover:bg-white/10"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete Album'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Sortable Track Item Component
function SortableTrackItem({ track }: { track: Track }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-md hover:bg-white/10 transition-colors"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-white transition-colors"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-mono text-white truncate block">
          {track.title}
        </span>
      </div>
      <div className="text-xs font-mono text-muted-foreground">
        {track.track_number}
      </div>
    </div>
  )
}
