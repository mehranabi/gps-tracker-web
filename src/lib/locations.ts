export const API_KEY_STORAGE_KEY = 'gps-tracker-api-key'
export const DEFAULT_PAGE_SIZE = 20

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

export type LocationsResponse = {
  data: GpsRecord[]
  total: number
  page: number
  pageSize: number
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
  pageSize: number
): Promise<LocationsResponse> {
  const response = await fetch(
    `/api/locations?page=${page}&pageSize=${pageSize}`,
    {
      headers: {
        Authorization: apiKey,
      },
    }
  )

  if (response.status === 401) {
    throw new UnauthorizedError()
  }

  if (!response.ok) {
    throw new Error('Failed to load records')
  }

  return (await response.json()) as LocationsResponse
}
