import { z } from 'zod'

const DEVICE_TIMESTAMP_PATTERN = /^\d{14}(\.\d+)?$/

function parseDeviceTimestamp(value: string) {
  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(4, 6))
  const day = Number(value.slice(6, 8))
  const hour = Number(value.slice(8, 10))
  const minute = Number(value.slice(10, 12))
  const second = Number(value.slice(12, 14))
  const fraction = value.length > 14 ? Number(`0${value.slice(14)}`) : 0
  const millisecond = Math.round(fraction * 1000)

  return new Date(
    Date.UTC(year, month - 1, day, hour, minute, second, millisecond)
  )
}

const finiteNumberFromString = z
  .string()
  .trim()
  .min(1)
  .transform((value, ctx) => {
    const parsed = Number(value)

    if (!Number.isFinite(parsed)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Must be a finite number',
      })
      return z.NEVER
    }

    return parsed
  })

const integerFromString = z
  .string()
  .trim()
  .min(1)
  .transform((value, ctx) => {
    const parsed = Number(value)

    if (!Number.isInteger(parsed)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Must be an integer',
      })
      return z.NEVER
    }

    return parsed
  })

export const locationPayloadSchema = z.object({
  timestamp: z
    .string()
    .trim()
    .regex(DEVICE_TIMESTAMP_PATTERN, 'Must match YYYYMMDDHHmmss[.fraction]')
    .transform((value, ctx) => {
      const recordedAt = parseDeviceTimestamp(value)

      if (Number.isNaN(recordedAt.getTime())) {
        ctx.addIssue({
          code: 'custom',
          message: 'Invalid timestamp',
        })
        return z.NEVER
      }

      return recordedAt
    }),
  latitude: finiteNumberFromString,
  longitude: finiteNumberFromString,
  altitude: finiteNumberFromString,
  speed: finiteNumberFromString,
  course: finiteNumberFromString,
  hdop: finiteNumberFromString,
  pdop: finiteNumberFromString,
  vdop: finiteNumberFromString,
  sats_view: integerFromString,
  sats_used: integerFromString,
  username: z.string().trim().min(1),
})

export const locationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
