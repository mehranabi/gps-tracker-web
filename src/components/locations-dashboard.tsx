'use client'

import { RefreshCwIcon } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { type DateRange } from 'react-day-picker'

import { ApiKeyGate } from '@/components/api-key-gate'
import { DateRangeFilter } from '@/components/date-range-filter'
import { LocationsTable } from '@/components/locations-table'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  API_KEY_STORAGE_KEY,
  AUTO_REFRESH_INTERVAL_MS,
  DEFAULT_PAGE_SIZE,
  GpsRecord,
  LocationFilters,
  UnauthorizedError,
  fetchLocations,
} from '@/lib/locations'
import { cn } from '@/lib/utils'

const ALL_USERNAMES = 'all'

function subscribeToApiKey() {
  return () => {}
}

function getStoredApiKey() {
  return sessionStorage.getItem(API_KEY_STORAGE_KEY)
}

function getServerApiKey() {
  return null
}

function formatDateParam(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function toLocationFilters(
  username: string,
  dateRange: DateRange | undefined
): LocationFilters {
  return {
    username: username === ALL_USERNAMES ? undefined : username,
    from: dateRange?.from ? formatDateParam(dateRange.from) : undefined,
    to: dateRange?.to
      ? formatDateParam(dateRange.to)
      : dateRange?.from
        ? formatDateParam(dateRange.from)
        : undefined,
  }
}

export function LocationsDashboard() {
  const storedKey = useSyncExternalStore(
    subscribeToApiKey,
    getStoredApiKey,
    getServerApiKey
  )
  const didRestore = useRef(false)
  const isLoadingRef = useRef(false)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [data, setData] = useState<GpsRecord[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [total, setTotal] = useState(0)
  const [unlocked, setUnlocked] = useState(false)
  const [username, setUsername] = useState(ALL_USERNAMES)
  const [usernames, setUsernames] = useState<string[]>([])

  const loadPage = useCallback(
    async (
      key: string,
      nextPage: number,
      nextPageSize: number,
      nextUsername: string,
      nextDateRange: DateRange | undefined,
      options: { skipIfLoading?: boolean } = {}
    ) => {
      if (options.skipIfLoading && isLoadingRef.current) {
        return false
      }

      isLoadingRef.current = true
      setIsLoading(true)
      setError(null)

      try {
        const result = await fetchLocations(
          key,
          nextPage,
          nextPageSize,
          toLocationFilters(nextUsername, nextDateRange)
        )
        sessionStorage.setItem(API_KEY_STORAGE_KEY, key)
        setApiKey(key)
        setData(result.data)
        setPage(result.page)
        setPageSize(result.pageSize)
        setTotal(result.total)
        setUsernames(result.usernames)
        setUnlocked(true)
        return true
      } catch (loadError) {
        if (loadError instanceof UnauthorizedError) {
          sessionStorage.removeItem(API_KEY_STORAGE_KEY)
          setApiKey(null)
          setAutoRefresh(false)
          setUnlocked(false)
          setData([])
          setTotal(0)
          setUsernames([])
          setError('The API key is not valid.')
          return false
        }

        setError('The records did not load. Try again.')
        return false
      } finally {
        isLoadingRef.current = false
        setIsLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (didRestore.current || !storedKey) {
      return
    }

    didRestore.current = true
    void loadPage(storedKey, 1, DEFAULT_PAGE_SIZE, ALL_USERNAMES, undefined)
  }, [loadPage, storedKey])

  useEffect(() => {
    if (!autoRefresh || !apiKey) {
      return
    }

    const timer = window.setInterval(() => {
      void loadPage(apiKey, page, pageSize, username, dateRange, {
        skipIfLoading: true,
      })
    }, AUTO_REFRESH_INTERVAL_MS)

    return () => {
      window.clearInterval(timer)
    }
  }, [apiKey, autoRefresh, dateRange, loadPage, page, pageSize, username])

  function handleSignOut() {
    sessionStorage.removeItem(API_KEY_STORAGE_KEY)
    setApiKey(null)
    setAutoRefresh(false)
    setData([])
    setDateRange(undefined)
    setError(null)
    setPage(1)
    setPageSize(DEFAULT_PAGE_SIZE)
    setTotal(0)
    setUnlocked(false)
    setUsername(ALL_USERNAMES)
    setUsernames([])
  }

  if (storedKey && !unlocked && !error) {
    return (
      <main className='flex flex-1 items-center justify-center p-6'>
        <Skeleton className='h-64 w-full max-w-md' />
      </main>
    )
  }

  if (!unlocked) {
    return (
      <ApiKeyGate
        error={error}
        isSubmitting={isLoading}
        onSubmit={(key) => {
          void loadPage(key, 1, DEFAULT_PAGE_SIZE, ALL_USERNAMES, undefined)
        }}
      />
    )
  }

  return (
    <main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div className='flex flex-col gap-1'>
          <h1 className='font-heading text-2xl font-medium'>GPS Tracker</h1>
          <p className='text-muted-foreground text-sm'>
            Location records from the GPS device.
          </p>
        </div>
        <Button onClick={handleSignOut} type='button' variant='outline'>
          Sign out
        </Button>
      </div>
      <Card>
        <CardHeader className='border-b'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
            <div className='flex flex-col gap-1.5'>
              <CardTitle>Records</CardTitle>
              <CardDescription>
                Newest records are first. Use the API key to load each page.
              </CardDescription>
            </div>
            <Button
              aria-pressed={autoRefresh}
              disabled={isLoading}
              onClick={() => setAutoRefresh((current) => !current)}
              type='button'
              variant={autoRefresh ? 'default' : 'outline'}
            >
              <RefreshCwIcon className={cn(isLoading && 'animate-spin')} />
              {autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className='pt-4'>
          <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end'>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='username-filter'>Username</Label>
              <Select
                onValueChange={(value) => {
                  setUsername(value)
                  setPage(1)

                  if (apiKey) {
                    void loadPage(apiKey, 1, pageSize, value, dateRange)
                  }
                }}
                value={username}
              >
                <SelectTrigger className='w-full min-w-48' id='username-filter'>
                  <SelectValue placeholder='Select a username' />
                </SelectTrigger>
                <SelectContent position='popper'>
                  <SelectItem value={ALL_USERNAMES}>All usernames</SelectItem>
                  {usernames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DateRangeFilter
              onChange={(nextRange) => {
                setDateRange(nextRange)
                setPage(1)

                if (apiKey) {
                  void loadPage(apiKey, 1, pageSize, username, nextRange)
                }
              }}
              range={dateRange}
            />
          </div>
          {error && !isLoading ? (
            <p className='text-destructive mb-4 text-sm'>{error}</p>
          ) : null}
          <LocationsTable
            data={data}
            isLoading={isLoading}
            onNextPage={() => {
              if (apiKey) {
                void loadPage(apiKey, page + 1, pageSize, username, dateRange)
              }
            }}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize)
              setPage(1)

              if (apiKey) {
                void loadPage(apiKey, 1, nextPageSize, username, dateRange)
              }
            }}
            onPreviousPage={() => {
              if (apiKey) {
                void loadPage(apiKey, page - 1, pageSize, username, dateRange)
              }
            }}
            page={page}
            pageSize={pageSize}
            total={total}
          />
        </CardContent>
      </Card>
    </main>
  )
}
