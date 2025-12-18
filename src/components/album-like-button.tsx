'use client'

import React, { useOptimistic, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toggleAlbumSave } from '@/actions/album-saves'
import { useAuthModal } from '@/hooks/use-auth-modal'

interface AlbumLikeButtonProps {
  albumId: string
  initialIsSaved: boolean
  size?: 'sm' | 'default' | 'lg'
  variant?: 'ghost' | 'default'
}

export function AlbumLikeButton({
  albumId,
  initialIsSaved,
  size = 'sm',
  variant = 'ghost'
}: AlbumLikeButtonProps) {
  const { open: openAuthModal } = useAuthModal()
  const [isPending, startTransition] = useTransition()
  const [optimisticIsSaved, setOptimisticIsSaved] = useOptimistic(
    initialIsSaved,
    (currentState) => !currentState
  )

  const handleToggleSave = async () => {
    console.log('[AlbumLikeButton] handleToggleSave called', {
      albumId,
      currentState: optimisticIsSaved,
      isPending
    })

    // Don't attempt to toggle if albumId is invalid
    if (!albumId || albumId.trim() === '') {
      console.error('[AlbumLikeButton] Invalid album ID for save toggle:', albumId)
      return
    }

    startTransition(async () => {
      const previousState = optimisticIsSaved
      const newOptimisticState = !optimisticIsSaved
      
      console.log('[AlbumLikeButton] Starting transition', {
        albumId,
        previousState,
        newOptimisticState
      })

      // Optimistically update the UI
      setOptimisticIsSaved(newOptimisticState)

      try {
        // Call the server action
        console.log('[AlbumLikeButton] Calling toggleAlbumSave server action...')
        const result = await toggleAlbumSave(albumId)
        
        console.log('[AlbumLikeButton] Server action result:', {
          success: result.success,
          isSaved: result.isSaved,
          error: result.error
        })

        // If the server action failed, revert the optimistic update
        if (!result.success) {
          console.error('[AlbumLikeButton] Server action failed, reverting optimistic update', {
            error: result.error,
            revertingTo: previousState
          })
          setOptimisticIsSaved(previousState)
          if (result.error?.toLowerCase().includes('logged in') || result.error?.toLowerCase().includes('auth')) {
            openAuthModal('signin')
          }
        } else {
          console.log('[AlbumLikeButton] Server action succeeded, keeping optimistic state:', newOptimisticState)
        }
      } catch (error) {
        console.error('[AlbumLikeButton] Exception in transition:', error)
        setOptimisticIsSaved(previousState)
      }
    })
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleSave}
      disabled={isPending}
      className={`
        transition-colors duration-200
        ${optimisticIsSaved
          ? 'text-[#ff565f] hover:text-[#ff565f]/80'
          : 'text-muted-foreground hover:text-[#ff565f]'
        }
      `}
    >
      <Heart
        className={`w-4 h-4 ${optimisticIsSaved ? 'fill-current' : ''}`}
      />
    </Button>
  )
}
