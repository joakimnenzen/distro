'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Upload, X } from 'lucide-react'

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
    const fileExt = file.name.split('.').pop()
    const fileName = `${band.id}-${Date.now()}.${fileExt}`
    const filePath = `band-images/${fileName}`

    console.log('Uploading image:', { fileName, filePath, bucket: 'band-images', fileSize: file.size, fileType: file.type })

    // Note: Skipping bucket existence check as it can be unreliable
    // We'll handle bucket errors during the actual upload attempt

    // Create upload promise with timeout
    const uploadPromise = supabase.storage
      .from('band-images')
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
          throw new Error('band-images bucket does not exist or is not accessible. Please ensure the bucket was created successfully in Supabase.')
        }

        // Check for permission errors
        if (uploadError.message?.includes('permission') || uploadError.message?.includes('policy')) {
          throw new Error('You do not have permission to upload to the band-images bucket. Please check your authentication status.')
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
        throw new Error('band-images bucket does not exist or is not accessible. Please ensure the bucket was created successfully in Supabase.')
      }

      throw timeoutError
    }

    // Get public URL
    try {
      const { data } = supabase.storage
        .from('band-images')
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

      // Update band record
      const { error, data } = await supabase
        .from('bands')
        .update(updateData)
        .eq('id', band.id)
        .select()

      if (error) {
        console.error('Database update error:', error)
        throw error
      }

      console.log('Database update successful:', data)

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
        </form>
      </SheetContent>
    </Sheet>
  )
}
