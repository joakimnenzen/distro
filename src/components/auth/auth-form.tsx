'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AuthFormProps {
  onSuccess?: () => void
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      
      setEmailSent(true)
      toast({
        title: "Email sent",
        description: "Check your email for the magic link!",
      })
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to sign in with Google',
        variant: "destructive",
      })
    }
  }


  // Show success message after email is sent
  if (emailSent) {
    return (
      <div className="space-y-4 text-center py-8">
        <div className="space-y-2">
          <h3 className="text-lg font-bold font-sans text-white">
            Check your email!
          </h3>
          <p className="text-sm text-muted-foreground font-mono">
            We sent a magic link to <span className="text-white font-medium">{email}</span>
          </p>
          <p className="text-xs text-muted-foreground font-mono mt-4">
            Click the link in the email to sign in. The link will expire in 1 hour.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setEmailSent(false)
            setEmail('')
          }}
          className="border-white/20 text-white hover:bg-white/10 font-mono"
        >
          Use a different email
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Social Auth Button - Top */}
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleAuth}
        disabled={isLoading}
        className="w-full border-white/20 text-white hover:bg-white/10 font-mono"
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Sign in with Google
      </Button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-black px-2 text-muted-foreground font-mono">OR</span>
        </div>
      </div>

      {/* Email Form - Bottom */}
      <form onSubmit={handleEmailAuth} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md font-mono">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-white font-sans">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="bg-white/5 border-white/20 text-white font-mono"
            required
            disabled={isLoading}
          />
        </div>

        {/* Primary Button */}
        <Button
          type="submit"
          disabled={isLoading || !email.trim()}
          className="w-full bg-[#ff565f] hover:bg-[#ff565f]/90 text-white font-mono"
        >
          {isLoading ? 'Sending...' : 'Continue with Email'}
        </Button>

        {/* Legal Disclaimer */}
        <p className="text-xs text-muted-foreground text-center font-mono">
          By clicking continue, you agree to our{' '}
          <Link 
            href="/terms" 
            className="underline hover:text-white transition-colors"
          >
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link 
            href="/privacy" 
            className="underline hover:text-white transition-colors"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </div>
  )
}
