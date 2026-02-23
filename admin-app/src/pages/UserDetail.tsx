import { useParams, Link } from 'react-router-dom'
import { useUsers } from '@/hooks/api/useUsers'
import { useUserDocuments } from '@/hooks/api/useDocuments'
import { useFreezeUser, useEnableUser } from '@/hooks/api/useUsers'
import { useCan } from '@/hooks/useCan'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Lock, Unlock, ArrowLeft } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { UserDocument } from '@/types'

export function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const can = useCan()
  const { data: listData, isLoading } = useUsers({ page: 0, size: 500 })
  const { data: docsData } = useUserDocuments(id)
  const freezeUser = useFreezeUser()
  const enableUser = useEnableUser()

  const resolvedUser = listData?.content?.find((u) => u.id === id)
  const docs: UserDocument[] = docsData?.content ?? []

  if (!id) return <div>Missing user ID</div>
  if (isLoading && !resolvedUser) return <div>Loading...</div>
  if (!resolvedUser) return <div>User not found</div>

  return (
    <div>
      <Link to="/users" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Users
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">User {resolvedUser.id.slice(0, 8)}...</h1>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Details</CardTitle>
          {can.canFreezeEnableUser && (
            <span className="flex gap-2">
              {resolvedUser.frozen ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => enableUser.mutate({ userId: id, enable: true })}
                  disabled={enableUser.isPending}
                >
                  <Unlock className="h-3 w-3 mr-1" /> Enable
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => freezeUser.mutate({ userId: id })}
                  disabled={freezeUser.isPending}
                >
                  <Lock className="h-3 w-3 mr-1" /> Freeze
                </Button>
              )}
            </span>
          )}
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Phone:</span> {resolvedUser.phoneNormalized ?? resolvedUser.userNumber ?? '—'}</p>
          <p><span className="text-muted-foreground">Onboarding:</span> {resolvedUser.onboardingStep ?? '—'}</p>
          <p><span className="text-muted-foreground">Enabled:</span> {resolvedUser.enabled ? 'Yes' : 'No'}</p>
          <p><span className="text-muted-foreground">Frozen:</span> {resolvedUser.frozen ? 'Yes' : 'No'}</p>
          <p><span className="text-muted-foreground">Created:</span> {formatDate(resolvedUser.createdAt)}</p>
        </CardContent>
      </Card>

      {can.canReviewKyc && (
        <Card>
          <CardHeader>
            <CardTitle>KYC Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">No documents</TableCell>
                  </TableRow>
                ) : (
                  docs.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.documentType}</TableCell>
                      <TableCell><Badge>{d.status}</Badge></TableCell>
                      <TableCell>{formatDate(d.uploadedAt)}</TableCell>
                      <TableCell>
                        <Link to={`/kyc/${d.id}`} className="text-primary hover:underline">Review</Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
