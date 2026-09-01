import {
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

export const gpsRecords = pgTable('gps_records', {
  id: serial('id').primaryKey(),
  recordedAt: timestamp('recorded_at', {
    withTimezone: true,
    mode: 'date',
  }).notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  altitude: doublePrecision('altitude').notNull(),
  speed: doublePrecision('speed').notNull(),
  course: doublePrecision('course').notNull(),
  hdop: doublePrecision('hdop').notNull(),
  pdop: doublePrecision('pdop').notNull(),
  vdop: doublePrecision('vdop').notNull(),
  satsView: integer('sats_view').notNull(),
  satsUsed: integer('sats_used').notNull(),
  username: text('username').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
})
