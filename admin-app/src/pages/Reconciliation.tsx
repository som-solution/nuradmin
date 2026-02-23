import { useRunReconciliation } from '@/hooks/api/useReconciliation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function Reconciliation() {
  const runReconciliation = useRunReconciliation()

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Reconciliation</h1>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Run reconciliation</CardTitle>
          <p className="text-sm text-muted-foreground">SUPER_ADMIN and ADMIN only.</p>
        </CardHeader>
        <CardContent>
          <Button onClick={() => runReconciliation.mutate()} disabled={runReconciliation.isPending}>
            {runReconciliation.isPending ? 'Running...' : 'Run'}
          </Button>
          {runReconciliation.isSuccess && <p className="mt-2 text-sm text-green-600">Done.</p>}
          {runReconciliation.isError && <p className="mt-2 text-sm text-destructive">Error running reconciliation.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
