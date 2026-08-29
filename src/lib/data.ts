import { createServerFn } from '@tanstack/react-start'
import { eq, and } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { appData } from '../../db/schema.js'
import { requireAuthMiddleware } from '../middleware/identity.js'

/** Fetches every stored key/value pair for the current user. */
export const getAllData = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    const rows = await db
      .select()
      .from(appData)
      .where(eq(appData.userId, context.user.id))
    const out: Record<string, string> = {}
    for (const row of rows) out[row.key] = row.value
    return out
  })

/** Upserts a single key/value pair for the current user. */
export const setData = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator((data: { key: string; value: string }) => data)
  .handler(async ({ context, data }) => {
    await db
      .insert(appData)
      .values({ userId: context.user.id, key: data.key, value: data.value })
      .onConflictDoUpdate({
        target: [appData.userId, appData.key],
        set: { value: data.value, updatedAt: new Date() },
      })
    return { ok: true }
  })

/** Upserts many key/value pairs at once (used for import/reset). */
export const setManyData = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator((data: { entries: Array<{ key: string; value: string }> }) => data)
  .handler(async ({ context, data }) => {
    for (const entry of data.entries) {
      await db
        .insert(appData)
        .values({ userId: context.user.id, key: entry.key, value: entry.value })
        .onConflictDoUpdate({
          target: [appData.userId, appData.key],
          set: { value: entry.value, updatedAt: new Date() },
        })
    }
    return { ok: true }
  })

/** Deletes a key for the current user (used by reset). */
export const clearData = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .inputValidator((data: { key: string }) => data)
  .handler(async ({ context, data }) => {
    await db
      .delete(appData)
      .where(and(eq(appData.userId, context.user.id), eq(appData.key, data.key)))
    return { ok: true }
  })
