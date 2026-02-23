import { useState } from 'react'
import { useSetProviderEnabled } from '@/hooks/api/useProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function Provider() {
  const [providerCode, setProviderCode] = useState('SAFARICOM')
  const [enabled, setEnabled] = useState(true)
  const setProvider = useSetProviderEnabled()

  const handleToggle = () => {
    setProvider.mutate(
      { providerCode, enabled },
      { onSuccess: () => setEnabled((e) => !e) }
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Payout Provider</h1>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Toggle provider</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Provider code</Label>
            <Input value={providerCode} onChange={(e) => setProviderCode(e.target.value)} placeholder="SAFARICOM" />
          </div>
          <Button onClick={handleToggle} disabled={setProvider.isPending}>
            Set {enabled ? 'disabled' : 'enabled'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
