import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdmins, useCreateAdmin } from '@/hooks/api/useAdmins'
import { DataTable, type Column } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import { formatDate } from '@/lib/utils'
import type { Admin, AdminType } from '@/types'
import { Plus } from 'lucide-react'

const ADMIN_TYPES: AdminType[] = ['SUPER_ADMIN', 'ADMIN', 'OPS', 'SUPPORT']

export function Admins() {
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [adminType, setAdminType] = useState<AdminType>('OPS')
  const createAdmin = useCreateAdmin()

  const { data, isLoading } = useAdmins({ page, size, sort: 'createdAt,desc' })
  const content = data?.content ?? []
  const totalElements = data?.totalElements ?? 0

  const handleCreate = () => {
    createAdmin.mutate(
      { email, password, adminType },
      {
        onSuccess: () => {
          setOpen(false)
          setEmail('')
          setPassword('')
        },
      }
    )
  }

  const columns: Column<Admin>[] = [
    { id: 'email', header: 'Email', cell: (r) => r.email },
    { id: 'adminType', header: 'Role', cell: (r) => r.adminType },
    { id: 'enabled', header: 'Enabled', cell: (r) => (r.enabled ? 'Yes' : 'No') },
    { id: 'createdAt', header: 'Created', cell: (r) => formatDate(r.createdAt) },
    {
      id: 'actions',
      header: 'Actions',
      cell: (r) => (
        <Link to={`/admins/${r.id}`} className="text-primary hover:underline">Edit</Link>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admins</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Create admin
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={content}
        totalElements={totalElements}
        page={page}
        size={size}
        onPageChange={setPage}
        onSizeChange={setSize}
        isLoading={isLoading}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ops@nurpay.local"
              />
            </div>
            <div className="space-y-2">
              <Label>Password (min 8 chars)</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={adminType}
                onChange={(e) => setAdminType(e.target.value as AdminType)}
              >
                {ADMIN_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={createAdmin.isPending || !email || password.length < 8}
            >
              {createAdmin.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
