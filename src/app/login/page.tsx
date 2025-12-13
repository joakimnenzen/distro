'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthForm } from '@/components/auth/auth-form'

export default function LoginPage() {
  const router = useRouter()

  const handleSuccess = () => {
    // User will be redirected via the magic link
    // No need to redirect here since OTP handles it
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md bg-black/20 border-white/10">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold font-sans text-white">
            Distro
          </CardTitle>
          <CardDescription className="text-muted-foreground font-mono text-sm">
            Log in or create an account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  )
}
