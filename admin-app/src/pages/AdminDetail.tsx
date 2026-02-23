import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { adminsApi } from '@/api/admins'
import { useUpdateAdmin } from '@/hooks/api/useAdmins'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'

export function AdminDetail() {
  const { id } = useParams<{ id: string }>()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const updateAdmin = useUpdateAdmin()

  const { data: page, isLoading } = useQuery({
    queryKey: ['admin', 'admins', id],
    queryFn: () => adminsApi.list({ page: 0, size: 100 }).then((r) => r.data),
    enabled: !!id,
  })
  const admin = page?.content?.find((a) => a.id === id)

  const handleSave = () => {
    if (!id) return
    const body: { email?: string; password?: string } = {}
    if (email.trim()) body.email = email.trim()
    if (password) body.password = password
    if (Object.keys(body).length === 0) return
    updateAdmin.mutate({ adminId: id, body })
  }

  if (!id) return <div>Missing admin ID</div>
  if (isLoading && !admin) return <div>Loading...</div>
  if (!admin) return <div>Admin not found</div>

  return (
    <div>
      <Link to="/admins" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Admins
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">Edit admin</h1>

      <Card className="mb-6 max-w-md">
        <CardHeader>
          <CardTitle>Current: {admin.email}</CardTitle>
          <p className="text-sm text-muted-foreground">Role: {admin.adminType}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>New email (optional)</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={admin.email}
            />
          </div>
          <div className="space-y-2">
            <Label>New password (optional, min 8)</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={
              updateAdmin.isPending ||
              (!email.trim() && !password) ||
              (password.length > 0 && password.length < 8)
            }
          >
            {updateAdmin.isPending ? 'Saving...' : 'Save'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
