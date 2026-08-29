import { createServerFn } from '@tanstack/react-start'
import { getUser } from '@netlify/identity'

export interface SessionUser {
  id: string
  email: string
  name: string
  roles: string[]
}

export const getServerUser = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SessionUser | null> => {
    const user = await getUser()
    if (!user) return null
    return { id: user.id, email: user.email ?? '', name: user.name ?? '', roles: user.roles ?? [] }
  },
)
