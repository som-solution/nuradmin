import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUsers, useFreezeUser, useEnableUser } from '@/hooks/api/useUsers'
import { useCan } from '@/hooks/useCan'
import { DataTable, type Column } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import type { User } from '@/types'
import { Lock, Unlock } from 'lucide-react'

export function Users() {
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const can = useCan()
  const { data, isLoading } = useUsers({ page, size, sort: 'createdAt,desc' })
  const freezeUser = useFreezeUser()
  const enableUser = useEnableUser()

  const content = data?.content ?? []
  const totalElements = data?.totalElements ?? 0

  const columns: Column<User>[] = [
    { id: 'phoneNormalized', header: 'Phone', cell: (r) => r.phoneNormalized ?? r.userNumber ?? '—' },
    { id: 'onboardingStep', header: 'Onboarding', cell: (r) => r.onboardingStep ?? '—' },
    { id: 'createdAt', header: 'Created', cell: (r) => formatDate(r.createdAt) },
    {
      id: 'status',
      header: 'Status',
      cell: (r) => (
        <span className="flex gap-1">
          {r.frozen ? <Badge variant="destructive">Frozen</Badge> : null}
          {!r.enabled ? <Badge variant="secondary">Disabled</Badge> : null}
          {r.enabled && !r.frozen ? <Badge variant="outline">Active</Badge> : null}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (r) => (
        <span className="flex items-center gap-2">
          <Link to={`/users/${r.id}`} className="text-primary hover:underline">
            View
          </Link>
          {can.canFreezeEnableUser && (
            <>
              {r.frozen ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => enableUser.mutate({ userId: r.id, enable: true })}
                  disabled={enableUser.isPending}
                >
                  <Unlock className="h-3 w-3 mr-1" /> Enable
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => freezeUser.mutate({ userId: r.id })}
                  disabled={freezeUser.isPending}
                >
                  <Lock className="h-3 w-3 mr-1" /> Freeze
                </Button>
              )}
            </>
          )}
        </span>
      ),
    },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Users</h1>
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
    </div>
  )
}
