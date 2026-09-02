'use client'

import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { type DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type DateRangeFilterProps = {
  onChange: (range: DateRange | undefined) => void
  range: DateRange | undefined
}

function formatRangeLabel(range: DateRange | undefined) {
  if (!range?.from) {
    return 'All dates'
  }

  if (!range.to) {
    return `${format(range.from, 'LLL d, yyyy')} – …`
  }

  return `${format(range.from, 'LLL d, yyyy')} – ${format(range.to, 'LLL d, yyyy')}`
}

export function DateRangeFilter({ onChange, range }: DateRangeFilterProps) {
  return (
    <div className='flex flex-col gap-1.5'>
      <Label htmlFor='date-range'>Date range</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            className={cn(
              'w-full min-w-56 justify-start font-normal sm:w-64',
              !range?.from && 'text-muted-foreground'
            )}
            id='date-range'
            type='button'
            variant='outline'
          >
            <CalendarIcon />
            {formatRangeLabel(range)}
          </Button>
        </PopoverTrigger>
        <PopoverContent align='start' className='w-auto p-0'>
          <Calendar mode='range' onSelect={onChange} selected={range} />
          {range?.from ? (
            <div className='border-t p-2'>
              <Button
                className='w-full'
                onClick={() => onChange(undefined)}
                size='sm'
                type='button'
                variant='ghost'
              >
                Clear dates
              </Button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  )
}
