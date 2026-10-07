import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

import { api, tokenStore } from '@/lib/api'
import type { User } from '@/lib/types'

interface Meta {
  crops: string[]
  regions: string[]
  market_regions: string[]
}

interface AuthState {
  user: User | null
  loading: boolean
  meta: Meta
  login: (email: string, password: string) => Promise<User>
  register: (data: Record<string, unknown>) => Promise<User>
  logout: () => void
  setUser: (u: User) => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState<Meta>({ crops: [], regions: [], market_regions: [] })

  useEffect(() => {
    api<Meta>('/meta').then(setMeta).catch(() => {})
    if (!tokenStore.get()) {
      setLoading(false)
      return
    }
    api<{ user: User }>('/auth/me')
      .then((r) => setUser(r.user))
      .catch(() => tokenStore.set(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const onLogout = () => setUser(null)
    window.addEventListener('agri:logout', onLogout)
    return () => window.removeEventListener('agri:logout', onLogout)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const r = await api<{ token: string; user: User }>('/auth/login', { method: 'POST', body: { email, password } })
    tokenStore.set(r.token)
    setUser(r.user)
    return r.user
  }, [])

  const register = useCallback(async (data: Record<string, unknown>) => {
    const r = await api<{ token: string; user: User }>('/auth/register', { method: 'POST', body: data })
    tokenStore.set(r.token)
    setUser(r.user)
    return r.user
  }, [])

  const logout = useCallback(() => {
    tokenStore.set(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, meta, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
