import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'

export function Header() {
  const email = useAuthStore((s) => s.email)
  const adminType = useAuthStore((s) => s.adminType)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <div />
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {email} <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{adminType}</span>
        </span>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
