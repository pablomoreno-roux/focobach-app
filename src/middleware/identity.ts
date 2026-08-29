import { createMiddleware } from '@tanstack/react-start'
import { getUser } from '@netlify/identity'

/** Extracts the Netlify Identity user, if any, without requiring auth. */
export const identityMiddleware = createMiddleware().server(async ({ next }) => {
  const user = (await getUser()) ?? null
  return next({ context: { user } })
})

/** Requires a valid authenticated user; throws otherwise. */
export const requireAuthMiddleware = createMiddleware().server(async ({ next }) => {
  const user = await getUser()
  if (!user) throw new Error('Authentication required')
  return next({ context: { user } })
})
