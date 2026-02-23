import { useState } from 'react'
import { useRates, useUpsertRate } from '@/hooks/api/useRates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ExchangeRate } from '@/types'

export function Rates() {
  const { data: rates, isLoading } = useRates()
  const upsertRate = useUpsertRate()
  const [editing, setEditing] = useState<string | null>(null)
  const [sendCurrency, setSendCurrency] = useState('GBP')
  const [receiveCurrency, setReceiveCurrency] = useState('KES')
  const [rate, setRate] = useState('')

  const list = Array.isArray(rates) ? rates : (rates as unknown as { content?: ExchangeRate[] })?.content ?? []

  const handleSave = (r?: ExchangeRate) => {
    if (r) {
      const newRate = (document.getElementById(`rate-${r.id}`) as HTMLInputElement)?.value
      if (newRate != null) {
        upsertRate.mutate(
          { sendCurrency: r.sendCurrency, receiveCurrency: r.receiveCurrency, rate: newRate },
          { onSettled: () => setEditing(null) }
        )
      }
    } else {
      if (!sendCurrency || !receiveCurrency || !rate) return
      upsertRate.mutate(
        { sendCurrency, receiveCurrency, rate },
        {
          onSuccess: () => {
            setRate('')
          },
        }
      )
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Exchange Rates</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add or update rate</CardTitle>
          <p className="text-sm text-muted-foreground">1 sendCurrency = rate receiveCurrency</p>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Send currency</label>
            <Input
              value={sendCurrency}
              onChange={(e) => setSendCurrency(e.target.value.toUpperCase())}
              placeholder="GBP"
              className="w-24"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Receive currency</label>
            <Input
              value={receiveCurrency}
              onChange={(e) => setReceiveCurrency(e.target.value.toUpperCase())}
              placeholder="KES"
              className="w-24"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Rate</label>
            <Input
              type="text"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="163.00"
              className="w-28"
            />
          </div>
          <Button onClick={() => handleSave()} disabled={upsertRate.isPending || !rate}>
            Save
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current rates</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Send</TableHead>
                <TableHead>Receive</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4}>Loading...</TableCell>
                </TableRow>
              ) : list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">No rates</TableCell>
                </TableRow>
              ) : (
                (list as ExchangeRate[]).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.sendCurrency}</TableCell>
                    <TableCell>{r.receiveCurrency}</TableCell>
                    <TableCell>
                      {editing === r.id ? (
                        <Input
                          id={`rate-${r.id}`}
                          defaultValue={r.rate}
                          className="w-24"
                          onBlur={() => handleSave(r)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSave(r)}
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:underline"
                          onClick={() => setEditing(r.id)}
                        >
                          {r.rate}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditing(r.id)
                          setSendCurrency(r.sendCurrency)
                          setReceiveCurrency(r.receiveCurrency)
                          setRate(String(r.rate))
                        }}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
