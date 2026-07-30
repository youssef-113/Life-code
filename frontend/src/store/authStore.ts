import { create } from 'zustand'
import type { AuthUser } from '@/types'

const STORAGE_KEY = 'lifecode.session'

interface StoredSession {
  user: AuthUser
  sessionToken: string
  refreshToken: string
}

interface AuthState {
  user: AuthUser | null
  sessionToken: string | null
  refreshToken: string | null
  hydrated: boolean
  setSession: (user: AuthUser, sessionToken: string, refreshToken: string) => void
  updateUser: (patch: Partial<AuthUser>) => void
  clearSession: () => void
}

function loadStored(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredSession
  } catch {
    return null
  }
}

function persist(session: StoredSession | null) {
  if (!session) {
    localStorage.removeItem(STORAGE_KEY)
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  }
}

const initial = loadStored()

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initial?.user ?? null,
  sessionToken: initial?.sessionToken ?? null,
  refreshToken: initial?.refreshToken ?? null,
  hydrated: true,
  setSession: (user, sessionToken, refreshToken) => {
    persist({ user, sessionToken, refreshToken })
    set({ user, sessionToken, refreshToken })
  },
  updateUser: (patch) => {
    const current = get().user
    if (!current) return
    const user = { ...current, ...patch }
    const { sessionToken, refreshToken } = get()
    if (sessionToken && refreshToken) persist({ user, sessionToken, refreshToken })
    set({ user })
  },
  clearSession: () => {
    persist(null)
    set({ user: null, sessionToken: null, refreshToken: null })
  },
}))

export function getStoredToken(): string | null {
  return loadStored()?.sessionToken ?? null
}
