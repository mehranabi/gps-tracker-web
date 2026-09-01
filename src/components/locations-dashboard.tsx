'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

import { ApiKeyGate } from '@/components/api-key-gate'
import { LocationsTable } from '@/components/locations-table'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  API_KEY_STORAGE_KEY,
  DEFAULT_PAGE_SIZE,
  GpsRecord,
  UnauthorizedError,
  fetchLocations,
} from '@/lib/locations'

function subscribeToApiKey() {
  return () => {}
}

function getStoredApiKey() {
  return sessionStorage.getItem(API_KEY_STORAGE_KEY)
}

function getServerApiKey() {
  return null
}

export function LocationsDashboard() {
  const storedKey = useSyncExternalStore(
    subscribeToApiKey,
    getStoredApiKey,
    getServerApiKey
  )
  const didRestore = useRef(false)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [data, setData] = useState<GpsRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [unlocked, setUnlocked] = useState(false)

  const loadPage = useCallback(async (key: string, nextPage: number) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchLocations(key, nextPage, DEFAULT_PAGE_SIZE)
      sessionStorage.setItem(API_KEY_STORAGE_KEY, key)
      setApiKey(key)
      setData(result.data)
      setPage(result.page)
      setTotal(result.total)
      setUnlocked(true)
      return true
    } catch (loadError) {
      if (loadError instanceof UnauthorizedError) {
        sessionStorage.removeItem(API_KEY_STORAGE_KEY)
        setApiKey(null)
        setUnlocked(false)
        setData([])
        setTotal(0)
        setError('The API key is not valid.')
        return false
      }

      setError('The records did not load. Try again.')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (didRestore.current || !storedKey) {
      return
    }

    didRestore.current = true
    void loadPage(storedKey, 1)
  }, [loadPage, storedKey])

  function handleSignOut() {
    sessionStorage.removeItem(API_KEY_STORAGE_KEY)
    setApiKey(null)
    setData([])
    setError(null)
    setPage(1)
    setTotal(0)
    setUnlocked(false)
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
          void loadPage(key, 1)
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
          <CardTitle>Records</CardTitle>
          <CardDescription>
            Newest records are first. Use the API key to load each page.
          </CardDescription>
        </CardHeader>
        <CardContent className='pt-4'>
          {error && !isLoading ? (
            <p className='text-destructive mb-4 text-sm'>{error}</p>
          ) : null}
          <LocationsTable
            data={data}
            isLoading={isLoading}
            onNextPage={() => {
              if (apiKey) {
                void loadPage(apiKey, page + 1)
              }
            }}
            onPreviousPage={() => {
              if (apiKey) {
                void loadPage(apiKey, page - 1)
              }
            }}
            page={page}
            pageSize={DEFAULT_PAGE_SIZE}
            total={total}
          />
        </CardContent>
      </Card>
    </main>
  )
}
