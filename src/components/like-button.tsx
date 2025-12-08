'use client'

import React, { useOptimistic, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toggleLike } from '@/actions/likes'

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
  const [isPending, startTransition] = useTransition()
  const [optimisticIsLiked, setOptimisticIsLiked] = useOptimistic(
    initialIsLiked,
    (currentState) => !currentState
  )

  const handleToggleLike = () => {
    // Don't attempt to toggle if trackId is invalid
    if (!trackId || trackId.trim() === '') {
      console.error('Invalid track ID for like toggle')
      return
    }

    startTransition(async () => {
      // Optimistically update the UI
      setOptimisticIsLiked(!optimisticIsLiked)

      // Call the server action
      const result = await toggleLike(trackId)

      // If the server action failed, revert the optimistic update
      if (!result.success) {
        setOptimisticIsLiked(optimisticIsLiked)
        console.error('Failed to toggle like:', result.error)
        // TODO: Show a toast notification for the error
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
