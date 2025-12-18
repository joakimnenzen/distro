'use client'

import React, { useOptimistic, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toggleLike } from '@/actions/likes'
import { useAuthModal } from '@/hooks/use-auth-modal'

interface LikeButtonProps {
  trackId: string
  initialIsLiked: boolean
  size?: 'sm' | 'default' | 'lg'
  variant?: 'ghost' | 'default'
}

export function LikeButton({
  trackId,
  initialIsLiked,
  size = 'sm',
  variant = 'ghost'
}: LikeButtonProps) {
  const { open: openAuthModal } = useAuthModal()
  const [isPending, startTransition] = useTransition()
  const [optimisticIsLiked, setOptimisticIsLiked] = useOptimistic(
    initialIsLiked,
    (currentState) => !currentState
  )

  const handleToggleLike = async () => {
    console.log('[LikeButton] handleToggleLike called', {
      trackId,
      currentState: optimisticIsLiked,
      isPending
    })

    // Don't attempt to toggle if trackId is invalid
    if (!trackId || trackId.trim() === '') {
      console.error('[LikeButton] Invalid track ID for like toggle:', trackId)
      return
    }

    startTransition(async () => {
      const previousState = optimisticIsLiked
      const newOptimisticState = !optimisticIsLiked
      
      console.log('[LikeButton] Starting transition', {
        trackId,
        previousState,
        newOptimisticState
      })

      // Optimistically update the UI
      setOptimisticIsLiked(newOptimisticState)

      try {
        // Call the server action
        console.log('[LikeButton] Calling toggleLike server action...')
        const result = await toggleLike(trackId)
        
        console.log('[LikeButton] Server action result:', {
          success: result.success,
          isLiked: result.isLiked,
          error: result.error
        })

        // If the server action failed, revert the optimistic update
        if (!result.success) {
          console.error('[LikeButton] Server action failed, reverting optimistic update', {
            error: result.error,
            revertingTo: previousState
          })
          setOptimisticIsLiked(previousState)

          // If server indicates auth issue, prompt sign-in
          if (result.error?.toLowerCase().includes('logged in') || result.error?.toLowerCase().includes('auth')) {
            openAuthModal('signin')
          }
        } else {
          console.log('[LikeButton] Server action succeeded, keeping optimistic state:', newOptimisticState)
        }
      } catch (error) {
        console.error('[LikeButton] Exception in transition:', error)
        setOptimisticIsLiked(previousState)
      }
    })
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleLike}
      disabled={isPending}
      className={`
        transition-colors duration-200
        ${optimisticIsLiked
          ? 'text-[#ff565f] hover:text-[#ff565f]/80'
          : 'text-muted-foreground hover:text-[#ff565f]'
        }
      `}
    >
      <Heart
        className={`w-4 h-4 ${optimisticIsLiked ? 'fill-current' : ''}`}
      />
    </Button>
  )
}
