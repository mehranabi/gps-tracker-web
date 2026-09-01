import { count, desc } from 'drizzle-orm'
import { z } from 'zod'

import { getDb } from '@/db'
import { gpsRecords } from '@/db/schema'
import { getProvidedApiKey, isValidApiKey } from '@/lib/api-key'
import {
  locationPayloadSchema,
  locationQuerySchema,
} from '@/lib/location-schema'

function unauthorizedResponse() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}

export async function POST(request: Request) {
  if (!isValidApiKey(getProvidedApiKey(request))) {
    return unauthorizedResponse()
  }

  let json: unknown

  try {
    json = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = locationPayloadSchema.safeParse(json)

  if (!parsed.success) {
    return Response.json(
      {
        error: 'Invalid payload',
        issues: z.flattenError(parsed.error),
      },
      { status: 400 }
    )
  }

  const payload = parsed.data
  const db = getDb()
  const [row] = await db
    .insert(gpsRecords)
    .values({
      recordedAt: payload.timestamp,
      latitude: payload.latitude,
      longitude: payload.longitude,
      altitude: payload.altitude,
      speed: payload.speed,
      course: payload.course,
      hdop: payload.hdop,
      pdop: payload.pdop,
      vdop: payload.vdop,
      satsView: payload.sats_view,
      satsUsed: payload.sats_used,
      username: payload.username,
    })
    .returning({ id: gpsRecords.id })

  return Response.json({ id: row.id }, { status: 201 })
}

export async function GET(request: Request) {
  if (!isValidApiKey(getProvidedApiKey(request))) {
    return unauthorizedResponse()
  }

  const url = new URL(request.url)
  const parsed = locationQuerySchema.safeParse({
    page: url.searchParams.get('page') ?? undefined,
    pageSize: url.searchParams.get('pageSize') ?? undefined,
  })

  if (!parsed.success) {
    return Response.json(
      {
        error: 'Invalid query',
        issues: z.flattenError(parsed.error),
      },
      { status: 400 }
    )
  }

  const { page, pageSize } = parsed.data
  const db = getDb()
  const offset = (page - 1) * pageSize

  const [data, totalRows] = await Promise.all([
    db
      .select()
      .from(gpsRecords)
      .orderBy(desc(gpsRecords.recordedAt), desc(gpsRecords.id))
      .limit(pageSize)
      .offset(offset),
    db.select({ total: count() }).from(gpsRecords),
  ])

  return Response.json({
    data,
    total: totalRows[0]?.total ?? 0,
    page,
    pageSize,
  })
}
