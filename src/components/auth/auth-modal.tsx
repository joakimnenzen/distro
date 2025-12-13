'use client'

import React from 'react'
import { useAuthModal } from '@/hooks/use-auth-modal'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AuthForm } from './auth-form'

export function AuthModal() {
  const { isOpen, close } = useAuthModal()

  const handleSuccess = () => {
    // Modal will stay open to show success message
    // User will be redirected via the magic link
  }

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="bg-black border-white/10 text-white sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold font-sans">
            Distro
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-mono text-sm">
            Log in or create an account to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <AuthForm onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
