import * as React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface Column<T> {
  id: string
  header: string
  cell: (row: T) => React.ReactNode
  sortKey?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  totalElements?: number
  page?: number
  size?: number
  onPageChange?: (page: number) => void
  onSizeChange?: (size: number) => void
  onSort?: (sort: string) => void
  isLoading?: boolean
  emptyMessage?: string
}

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  totalElements = 0,
  page = 0,
  size = 20,
  onPageChange,
  onSizeChange,
  onSort,
  isLoading,
  emptyMessage = 'No data',
}: DataTableProps<T>) {
  const totalPages = size > 0 ? Math.ceil(totalElements / size) : 0
  const hasNext = page < totalPages - 1
  const hasPrev = page > 0

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  className={col.sortKey && onSort ? 'cursor-pointer hover:bg-muted/50' : ''}
                  onClick={() => col.sortKey && onSort?.(col.sortKey)}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, i) => (
                <TableRow key={(row as { id?: string }).id ?? i}>
                  {columns.map((col) => (
                    <TableCell key={col.id}>{col.cell(row)}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {(onPageChange || onSizeChange) && totalElements > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onSizeChange && (
              <Select
                value={String(size)}
                onChange={(e) => onSizeChange(Number(e.target.value))}
                className="w-20"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </Select>
            )}
            <span className="text-sm text-muted-foreground">
              {page * size + 1}-{Math.min((page + 1) * size, totalElements)} of {totalElements}
            </span>
          </div>
          {onPageChange && (
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                disabled={!hasPrev}
                onClick={() => onPageChange(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={!hasNext}
                onClick={() => onPageChange(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
