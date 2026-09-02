export const API_KEY_STORAGE_KEY = 'gps-tracker-api-key'
export const DEFAULT_PAGE_SIZE = 20
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const
export const AUTO_REFRESH_INTERVAL_MS = 5000

export type GpsRecord = {
  id: number
  recordedAt: string
  latitude: number
  longitude: number
  altitude: number
  speed: number
  course: number
  hdop: number
  pdop: number
  vdop: number
  satsView: number
  satsUsed: number
  username: string
  createdAt: string
}

export type LocationFilters = {
  username?: string
  from?: string
  to?: string
}

export type LocationsResponse = {
  data: GpsRecord[]
  total: number
  page: number
  pageSize: number
  usernames: string[]
}

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized')
    this.name = 'UnauthorizedError'
  }
}

export async function fetchLocations(
  apiKey: string,
  page: number,
  pageSize: number,
  filters: LocationFilters = {}
): Promise<LocationsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })

  if (filters.username) {
    params.set('username', filters.username)
  }

  if (filters.from) {
    params.set('from', filters.from)
  }

  if (filters.to) {
    params.set('to', filters.to)
  }

  const response = await fetch(`/api/locations?${params.toString()}`, {
    headers: {
      Authorization: apiKey,
    },
  })

  if (response.status === 401) {
    throw new UnauthorizedError()
  }

  if (!response.ok) {
    throw new Error('Failed to load records')
  }

  return (await response.json()) as LocationsResponse
}
