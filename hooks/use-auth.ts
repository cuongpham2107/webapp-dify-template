import { useSession } from 'next-auth/react'
import type { User } from '@/types/auth'

export function useAuth() {
  const { data: session, status } = useSession()

  return {
    user: session?.user as User | undefined,
    token: session?.token,
    isLoading: status === 'loading',
    isAuthenticated: !!session?.user,
    session,
  }
}

export function useRequireAuth() {
  const auth = useAuth()

  if (!auth.isAuthenticated && !auth.isLoading)
    throw new Error('Authentication required')

  return auth
}
