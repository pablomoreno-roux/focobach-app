import { useCallback, useEffect, useRef, useState } from 'react'
import { getAllData, setData, setManyData, clearData } from './data'

/**
 * Client-side replacement for the old `window.storage` mock.
 * Loads the user's full key/value map once, then persists individual
 * writes to the database (debounced per key), scoped to the logged-in user
 * by the server functions themselves.
 */
export function usePersistedStore() {
  const [store, setStore] = useState<Record<string, string> | null>(null)
  const [loadError, setLoadError] = useState(false)
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    getAllData()
      .then((data) => setStore(data))
      .catch(() => setLoadError(true))
  }, [])

  const get = useCallback((key: string): string | null => (store ? store[key] ?? null : null), [store])

  const set = useCallback((key: string, value: string) => {
    setStore((prev) => ({ ...(prev ?? {}), [key]: value }))
    if (timers.current[key]) clearTimeout(timers.current[key])
    return new Promise<void>((resolve, reject) => {
      timers.current[key] = setTimeout(async () => {
        try {
          await setData({ data: { key, value } })
          resolve()
        } catch (e) {
          reject(e)
        }
      }, 400)
    })
  }, [])

  const setMany = useCallback(async (entries: Array<{ key: string; value: string }>) => {
    setStore((prev) => {
      const next = { ...(prev ?? {}) }
      for (const e of entries) next[e.key] = e.value
      return next
    })
    await setManyData({ data: { entries } })
  }, [])

  const clear = useCallback(async (key: string) => {
    setStore((prev) => {
      const next = { ...(prev ?? {}) }
      delete next[key]
      return next
    })
    await clearData({ data: { key } })
  }, [])

  return { ready: store !== null, loadError, get, set, setMany, clear }
}
