import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ApiError } from '@/types'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard'

  const loginMutation = useMutation({
    mutationFn: () => authApi.login({ email, password }).then((r) => r.data),
    onSuccess: (data) => {
      setAuth({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        adminId: data.adminId,
        adminType: data.adminType,
        email: data.email,
      })
      navigate(from, { replace: true })
    },
  })

  const errorMessage =
    (loginMutation.error as ApiError & { response?: { status: number } })?.response?.status === 403
      ? 'Admin disabled'
      : (loginMutation.error as ApiError)?.error ??
        (loginMutation.error as ApiError)?.message ??
        (loginMutation.isError ? 'Invalid credentials' : null)

  if (isAuthenticated) {
    navigate(from, { replace: true })
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>NurPay Admin</CardTitle>
          <p className="text-sm text-muted-foreground">Sign in with your admin account</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@nurpay.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {errorMessage && (
            <p className="text-sm text-destructive">{errorMessage}</p>
          )}
          <Button
            className="w-full"
            onClick={() => loginMutation.mutate()}
            disabled={loginMutation.isPending || !email || !password}
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
