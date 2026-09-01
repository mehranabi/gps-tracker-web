'use client'

import {
  createColumnHelper,
  rowPaginationFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { GpsRecord } from '@/lib/locations'

const EMPTY_DATA: GpsRecord[] = []

const features = tableFeatures({
  rowPaginationFeature,
})

const columnHelper = createColumnHelper<typeof features, GpsRecord>()

function formatNumber(value: number, digits: number) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })
}

function formatTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'UTC',
  })
}

const columns = columnHelper.columns([
  columnHelper.accessor('recordedAt', {
    header: 'Time (UTC)',
    cell: (info) => formatTime(info.getValue()),
  }),
  columnHelper.accessor('username', {
    header: 'Username',
  }),
  columnHelper.accessor('latitude', {
    header: 'Latitude',
    cell: (info) => formatNumber(info.getValue(), 6),
  }),
  columnHelper.accessor('longitude', {
    header: 'Longitude',
    cell: (info) => formatNumber(info.getValue(), 6),
  }),
  columnHelper.accessor('altitude', {
    header: 'Altitude',
    cell: (info) => formatNumber(info.getValue(), 2),
  }),
  columnHelper.accessor('speed', {
    header: 'Speed',
    cell: (info) => formatNumber(info.getValue(), 2),
  }),
  columnHelper.accessor('course', {
    header: 'Course',
    cell: (info) => formatNumber(info.getValue(), 2),
  }),
  columnHelper.accessor('hdop', {
    header: 'HDOP',
    cell: (info) => formatNumber(info.getValue(), 2),
  }),
  columnHelper.accessor('pdop', {
    header: 'PDOP',
    cell: (info) => formatNumber(info.getValue(), 2),
  }),
  columnHelper.accessor('vdop', {
    header: 'VDOP',
    cell: (info) => formatNumber(info.getValue(), 2),
  }),
  columnHelper.accessor('satsView', {
    header: 'Sats view',
  }),
  columnHelper.accessor('satsUsed', {
    header: 'Sats used',
  }),
])

type LocationsTableProps = {
  data: GpsRecord[]
  isLoading: boolean
  onNextPage: () => void
  onPreviousPage: () => void
  page: number
  pageSize: number
  total: number
}

export function LocationsTable({
  data,
  isLoading,
  onNextPage,
  onPreviousPage,
  page,
  pageSize,
  total,
}: LocationsTableProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  const table = useTable({
    columns,
    data: data.length > 0 ? data : EMPTY_DATA,
    features,
    manualPagination: true,
    rowCount: total,
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize,
      },
    },
  })

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className='flex flex-col gap-4'>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : (
                    <table.FlexRender header={header} />
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, rowIndex) => (
              <TableRow key={`skeleton-${rowIndex}`}>
                {columns.map((column, cellIndex) => (
                  <TableCell key={`${column.id ?? cellIndex}-skeleton`}>
                    <Skeleton className='h-4 w-20' />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                className='text-muted-foreground h-24 text-center'
                colSpan={columns.length}
              >
                No location records.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-muted-foreground text-sm'>
          {total === 0
            ? '0 records'
            : `${from}–${to} of ${total} records · page ${page} of ${pageCount}`}
        </p>
        <div className='flex gap-2'>
          <Button
            disabled={isLoading || page <= 1}
            onClick={onPreviousPage}
            size='sm'
            type='button'
            variant='outline'
          >
            <ChevronLeftIcon />
            Previous
          </Button>
          <Button
            disabled={isLoading || page >= pageCount || total === 0}
            onClick={onNextPage}
            size='sm'
            type='button'
            variant='outline'
          >
            Next
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </div>
  )
}
