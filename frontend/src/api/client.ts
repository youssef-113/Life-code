import axios, { type AxiosInstance, AxiosError } from 'axios'
import { useAuthStore } from '@/store/authStore'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://life-code--yossfabdla311.replit.app/api/app'

export const http: AxiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
})

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().sessionToken
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

let refreshing: Promise<string | null> | null = null

async function attemptRefresh(): Promise<string | null> {
  const { refreshToken, user, setSession } = useAuthStore.getState()
  if (!refreshToken || !user) return null
  try {
    const res = await axios.post(`${baseURL}/refresh`, { refreshToken })
    const newToken: string = res.data?.data?.sessionToken
    if (newToken) {
      setSession(user, newToken, refreshToken)
      return newToken
    }
    return null
  } catch {
    return null
  }
}

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config
    if (error.response?.status === 401 && original && !(original as { _retry?: boolean })._retry) {
      ;(original as { _retry?: boolean })._retry = true
      if (!refreshing) refreshing = attemptRefresh()
      const newToken = await refreshing
      refreshing = null
      if (newToken) {
        original.headers = original.headers ?? new axios.AxiosHeaders()
        original.headers.set('Authorization', `Bearer ${newToken}`)
        return http.request(original)
      }
      useAuthStore.getState().clearSession()
    }
    return Promise.reject(error)
  },
)

export interface ApiErrorShape {
  code: number
  error: string
  message: string
}

export function extractApiError(err: unknown): ApiErrorShape {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as Partial<ApiErrorShape> | undefined
    return {
      code: err.response?.status ?? 0,
      error: data?.error ?? 'Request failed',
      message: data?.message ?? err.message ?? 'Something went wrong. Please try again.',
    }
  }
  if (err instanceof Error) {
    return { code: 0, error: 'Error', message: err.message }
  }
  return { code: 0, error: 'Error', message: 'Something went wrong. Please try again.' }
}
