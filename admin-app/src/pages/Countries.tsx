import { useState } from 'react'
import { useCountries, useCreateCountry, useUpdateCountry } from '@/hooks/api/useCountries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { SupportedCountry } from '@/types'
import { Plus } from 'lucide-react'

export function Countries() {
  const { data: countries, isLoading } = useCountries()
  const createCountry = useCreateCountry()
  const updateCountry = useUpdateCountry()
  const [open, setOpen] = useState(false)
  const [countryCode, setCountryCode] = useState('')
  const [name, setName] = useState('')
  const [currencyCode, setCurrencyCode] = useState('')
  const [dialCode, setDialCode] = useState('')
  const [phoneLength, setPhoneLength] = useState('9')
  const [displayOrder, setDisplayOrder] = useState('0')

  const list = Array.isArray(countries) ? countries : (countries as unknown as { content?: SupportedCountry[] })?.content ?? []

  const handleCreate = () => {
    createCountry.mutate(
      {
        countryCode: countryCode.trim(),
        name: name.trim(),
        currencyCode: currencyCode.trim(),
        dialCode: dialCode.trim(),
        phoneLength: Number(phoneLength),
        displayOrder: Number(displayOrder),
      },
      {
        onSuccess: () => {
          setOpen(false)
          setCountryCode('')
          setName('')
          setCurrencyCode('')
          setDialCode('')
          setPhoneLength('9')
          setDisplayOrder('0')
        },
      }
    )
  }

  const toggleEnabled = (c: SupportedCountry) => {
    updateCountry.mutate({
      countryCode: c.countryCode,
      body: { enabled: !c.enabled },
    })
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Supported Countries</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add country
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Dial</TableHead>
                <TableHead>Phone length</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7}>Loading...</TableCell></TableRow>
              ) : list.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-muted-foreground">No countries</TableCell></TableRow>
              ) : (
                (list as SupportedCountry[]).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.countryCode}</TableCell>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.currencyCode}</TableCell>
                    <TableCell>{c.dialCode}</TableCell>
                    <TableCell>{c.phoneLength}</TableCell>
                    <TableCell>
                      <Badge variant={c.enabled ? 'default' : 'secondary'}>{c.enabled ? 'Yes' : 'No'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => toggleEnabled(c)} disabled={updateCountry.isPending}>
                        {c.enabled ? 'Disable' : 'Enable'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add country</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Country code (e.g. SO)</label>
                <Input value={countryCode} onChange={(e) => setCountryCode(e.target.value.toUpperCase())} placeholder="SO" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Somalia" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Currency code</label>
                <Input value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())} placeholder="SOS" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Dial code</label>
                <Input value={dialCode} onChange={(e) => setDialCode(e.target.value)} placeholder="252" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone length</label>
                <Input type="number" value={phoneLength} onChange={(e) => setPhoneLength(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Display order</label>
                <Input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={createCountry.isPending || !countryCode || !name || !currencyCode || !dialCode}
            >
              {createCountry.isPending ? 'Adding...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
