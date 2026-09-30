import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios"
import type { ApiError } from "./types"

const ACCESS_KEY = "mh_access_token"
const REFRESH_KEY = "mh_refresh_token"

// Local dev: falls back to "/api", proxied to the backend by vite.config.ts. Production (the
// frontend and backend are on separate domains — portal.passmdcn.com / portalapi.passmdcn.com —
// so there's no same-origin proxy): set VITE_API_URL at build time, e.g.
// VITE_API_URL=https://portalapi.passmdcn.com/api
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api"

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS_KEY)
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY)
  },
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
})

// Attach the access token to every request.
api.interceptors.request.use((config) => {
  const token = tokenStore.access
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Single-flight refresh: queue requests that 401 while a refresh is in progress.
let refreshing: Promise<string | null> | null = null

async function doRefresh(): Promise<string | null> {
  const refresh = tokenStore.refresh
  if (!refresh) return null
  try {
    // Bare axios (not `api`) so we don't loop through this interceptor.
    const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken: refresh })
    tokenStore.set(res.data.accessToken, res.data.refreshToken)
    return res.data.accessToken as string
  } catch {
    tokenStore.clear()
    return null
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retried?: boolean }
    const status = error.response?.status
    const url = original?.url ?? ""
    const isAuthCall = url.includes("/auth/login") || url.includes("/auth/refresh") || url.includes("/auth/register")

    if (status === 401 && original && !original._retried && !isAuthCall && tokenStore.refresh) {
      original._retried = true
      refreshing = refreshing ?? doRefresh()
      const newToken = await refreshing
      refreshing = null
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      }
      // Refresh failed — force re-login.
      tokenStore.clear()
      if (!location.pathname.startsWith("/login")) {
        location.href = "/login"
      }
    }
    return Promise.reject(error)
  },
)

/** Extract a human-friendly message from an axios error. */
export function errorMessage(err: unknown, fallback = "Something went wrong"): string {
  const ax = err as AxiosError<ApiError>
  const data = ax.response?.data
  if (data?.fieldErrors?.length) {
    return data.fieldErrors.map((f) => f.message).join(", ")
  }
  return data?.message || ax.message || fallback
}

/** The machine-readable `error` code from an API error (e.g. "EMAIL_NOT_VERIFIED"), if any. */
export function errorCode(err: unknown): string | undefined {
  return (err as AxiosError<ApiError>).response?.data?.error
}
