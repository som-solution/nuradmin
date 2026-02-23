import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { documentsApi } from '@/api/documents'
import { useDocumentView, useApproveDocument, useRejectDocument } from '@/hooks/api/useDocuments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export function KycDocument() {
  const { documentId } = useParams<{ documentId: string }>()
  const [rejectReason, setRejectReason] = useState('')
  const viewDoc = useDocumentView()
  const approveDoc = useApproveDocument()
  const rejectDoc = useRejectDocument()

  const { data: doc, isLoading } = useQuery({
    queryKey: ['admin', 'documents', documentId],
    queryFn: async () => {
      const res = await documentsApi.list({ page: 0, size: 500 })
      const list = res.data.content ?? []
      return list.find((d) => d.id === documentId) ?? null
    },
    enabled: !!documentId,
  })

  const handleView = () => {
    if (!documentId) return
    viewDoc.mutate(documentId, {
      onSuccess: (data) => window.open(data.viewUrl, '_blank'),
    })
  }

  const handleApprove = () => {
    if (!documentId) return
    approveDoc.mutate(documentId)
  }

  const handleReject = () => {
    if (!documentId) return
    rejectDoc.mutate({ id: documentId, reason: rejectReason || undefined })
  }

  if (!documentId) return <div>Missing document ID</div>
  if (isLoading && !doc) return <div>Loading...</div>
  if (!doc) return <div>Document not found</div>

  const isPending = doc.status === 'PENDING'

  return (
    <div>
      <Link to="/kyc" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to KYC
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">Document {doc.documentType}</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">User:</span> <Link to={`/users/${doc.userId}`} className="text-primary hover:underline">{doc.userId}</Link></p>
          <p><span className="text-muted-foreground">Type:</span> {doc.documentType}</p>
          <p><span className="text-muted-foreground">Status:</span> {doc.status}</p>
          <p><span className="text-muted-foreground">Uploaded:</span> {doc.uploadedAt ?? '—'}</p>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <Button variant="outline" onClick={handleView} disabled={viewDoc.isPending}>
          Open document (presigned URL)
        </Button>

        {isPending && (
          <>
            <div className="space-y-2 max-w-md">
              <Label htmlFor="rejectReason">Rejection reason (optional)</Label>
              <Input
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection"
                maxLength={512}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleApprove} disabled={approveDoc.isPending}>
                Approve
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={rejectDoc.isPending}>
                Reject
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
