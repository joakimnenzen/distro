'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { useToast } from '@/hooks/use-toast'
import { deleteBand } from '@/actions/delete-band'
import { uploadBandImage } from '@/actions/upload-band-image'
import { updateBand } from '@/actions/update-band'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Upload, X, Trash2 } from 'lucide-react'

interface Band {
  id: string
  name: string
  slug: string
  bio: string | null
  image_url: string | null
  genre: string | null
  location: string | null
  albumsCount: number
  tracksCount: number
}

interface BandSettingsSheetProps {
  band: Band
  isOpen: boolean
  onClose: () => void
}

export function BandSettingsSheet({ band, isOpen, onClose }: BandSettingsSheetProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: band.name,
    bio: band.bio || '',
    genre: band.genre || '',
    location: band.location || '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(band.image_url)

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
    console.log('[uploadImage] Starting upload process via server action...')
    
    try {
      // Use server action for more reliable uploads
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bandId', band.id)

      console.log('[uploadImage] Calling server action...')
      const result = await uploadBandImage(formData)

      console.log('[uploadImage] Server action result:', {
        success: result.success,
        imageUrl: result.success ? result.imageUrl : undefined,
        error: result.success ? undefined : result.error
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      console.log('[uploadImage] Upload successful, URL:', result.imageUrl)
      return result.imageUrl
    } catch (error) {
      console.error('[uploadImage] Exception caught:', error)
      throw error instanceof Error ? error : new Error('An unexpected error occurred during upload')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let imageUrl = band.image_url

      console.log('Starting band update process...')
      console.log('Current band data:', { id: band.id, name: band.name })
      console.log('Form data:', formData)
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
        name: formData.name,
        bio: formData.bio || null,
        genre: formData.genre || null,
        location: formData.location || null,
        image_url: imageUrl,
      }

      console.log('Updating band with data:', updateData)

      // Update band record using server action
      const result = await updateBand(band.id, updateData)

      if (!result.success) {
        console.error('Database update error:', result.error)
        throw new Error(result.error)
      }

      console.log('Database update successful')

      toast({
        title: "Success",
        description: "Band updated successfully!",
      })

      console.log('Closing sheet and refreshing...')
      onClose()
      router.refresh()

    } catch (error) {
      console.error('Error in handleSubmit:', error)

      // More specific error messages
      let errorMessage = "Failed to update band. Please try again."
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const result = await deleteBand(band.id)

      if (result.success) {
        toast({
          title: "Success",
          description: "Band deleted successfully!",
        })
        onClose()
        router.push('/dashboard')
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
      console.error('Error deleting band:', error)
      toast({
        title: "Error",
        description: "Failed to delete band. Please try again.",
        variant: "destructive",
      })
      setShowDeleteDialog(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="bg-black border-white/10 text-white w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-white font-sans">Edit Band</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-white font-sans">Band Image</Label>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={imagePreview || ''} alt={band.name} />
                <AvatarFallback className="bg-white/10 text-white font-mono text-lg">
                  {formData.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
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
                      setImagePreview(band.image_url)
                    }}
                    className="ml-2 text-muted-foreground hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white font-sans">Band Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="bg-white/5 border-white/20 text-white font-mono"
              required
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-white font-sans">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              className="bg-white/5 border-white/20 text-white font-mono min-h-[100px]"
              placeholder="Tell us about your band..."
            />
          </div>

          {/* Genre */}
          <div className="space-y-2">
            <Label htmlFor="genre" className="text-white font-sans">Genre</Label>
            <Input
              id="genre"
              value={formData.genre}
              onChange={(e) => handleInputChange('genre', e.target.value)}
              className="bg-white/5 border-white/20 text-white font-mono"
              placeholder="e.g., Rock, Indie, Electronic"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-white font-sans">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="bg-white/5 border-white/20 text-white font-mono"
              placeholder="e.g., Stockholm, Sweden"
            />
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
              Delete Band
            </Button>
          </div>
        </form>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="bg-black border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="text-white font-sans">Delete Band</DialogTitle>
              <DialogDescription className="text-muted-foreground font-mono">
                Are you sure you want to delete &ldquo;{band.name}&rdquo;? This action cannot be undone.
                <br />
                <br />
                This will also delete all albums and tracks associated with this band.
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
                {isDeleting ? 'Deleting...' : 'Delete Band'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  )
}
