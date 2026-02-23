import { useState } from 'react'
import { useFeeConfig, useUpsertFeeConfig } from '@/hooks/api/useFeeConfig'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { FeeConfig as FeeConfigType } from '@/types'

export function FeeConfig() {
  const { data: configs, isLoading } = useFeeConfig()
  const upsertFee = useUpsertFeeConfig()
  const [sendCurrency, setSendCurrency] = useState('GBP')
  const [feePercent, setFeePercent] = useState('2.5')
  const [feeMinAmount, setFeeMinAmount] = useState('1')
  const [feeMaxAmount, setFeeMaxAmount] = useState('10')
  const [feeCurrency, setFeeCurrency] = useState('GBP')

  const list = Array.isArray(configs) ? configs : (configs as { content?: FeeConfigType[] } | undefined)?.content ?? []

  const handleAdd = () => {
    upsertFee.mutate({
      sendCurrency,
      feePercent: Number(feePercent),
      feeMinAmount: Number(feeMinAmount),
      feeMaxAmount: Number(feeMaxAmount),
      feeCurrency,
    })
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Fee Config</h1>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add or update fee (per send currency)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Send currency</label>
            <Input value={sendCurrency} onChange={(e) => setSendCurrency(e.target.value.toUpperCase())} className="w-24" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Fee %</label>
            <Input type="number" value={feePercent} onChange={(e) => setFeePercent(e.target.value)} className="w-20" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Min</label>
            <Input type="number" value={feeMinAmount} onChange={(e) => setFeeMinAmount(e.target.value)} className="w-20" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Max</label>
            <Input type="number" value={feeMaxAmount} onChange={(e) => setFeeMaxAmount(e.target.value)} className="w-20" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Fee currency</label>
            <Input value={feeCurrency} onChange={(e) => setFeeCurrency(e.target.value.toUpperCase())} className="w-24" />
          </div>
          <Button onClick={handleAdd} disabled={upsertFee.isPending}>Save</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Current configs</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Send currency</TableHead>
                <TableHead>Fee %</TableHead>
                <TableHead>Min</TableHead>
                <TableHead>Max</TableHead>
                <TableHead>Fee currency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={5}>Loading...</TableCell></TableRow> : list.length === 0 ? <TableRow><TableCell colSpan={5} className="text-muted-foreground">No configs</TableCell></TableRow> : (list as FeeConfigType[]).map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.sendCurrency}</TableCell>
                  <TableCell>{c.feePercent}</TableCell>
                  <TableCell>{c.feeMinAmount}</TableCell>
                  <TableCell>{c.feeMaxAmount}</TableCell>
                  <TableCell>{c.feeCurrency}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
