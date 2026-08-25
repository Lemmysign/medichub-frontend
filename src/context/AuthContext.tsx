import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { api, tokenStore } from "@/lib/api"
import type { AuthResponse, OtpChallengeResponse, Role, UserResponse, VerifyOtpResponse } from "@/lib/types"

interface RegisterPayload {
  fullName: string
  email: string
  phone?: string
  password: string
  role: Role
}

interface AuthState {
  user: UserResponse | null
  loading: boolean
  login: (email: string, password: string) => Promise<UserResponse>
  /** Creates the account and emails an OTP — does NOT log in. */
  register: (payload: RegisterPayload) => Promise<OtpChallengeResponse>
  /** Confirms the OTP; on a logged-in result the session is applied and the user returned. */
  verifyOtp: (email: string, code: string) => Promise<VerifyOtpResponse>
  resendOtp: (email: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (u: UserResponse) => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function bootstrap() {
      if (!tokenStore.access) {
        setLoading(false)
        return
      }
      try {
        const res = await api.get<UserResponse>("/account")
        setUser(res.data)
      } catch {
        tokenStore.clear()
      } finally {
        setLoading(false)
      }
    }
    bootstrap()
  }, [])

  function applyAuth(auth: AuthResponse) {
    tokenStore.set(auth.accessToken, auth.refreshToken)
    setUser(auth.user)
    return auth.user
  }

  async function login(email: string, password: string) {
    const res = await api.post<AuthResponse>("/auth/login", { email, password })
    return applyAuth(res.data)
  }

  async function register(payload: RegisterPayload) {
    const res = await api.post<OtpChallengeResponse>("/auth/register", payload)
    return res.data
  }

  async function verifyOtp(email: string, code: string) {
    const res = await api.post<VerifyOtpResponse>("/auth/verify-otp", { email, code })
    if (res.data.auth) applyAuth(res.data.auth)
    return res.data
  }

  async function resendOtp(email: string) {
    await api.post("/auth/resend-otp", { email })
  }

  async function logout() {
    try {
      if (tokenStore.refresh) {
        await api.post("/auth/logout", { refreshToken: tokenStore.refresh })
      }
    } catch {
      // ignore — clear locally regardless
    } finally {
      tokenStore.clear()
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyOtp, resendOtp, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

/** Default landing path for a role. */
export function homePathFor(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin"
    case "INSTRUCTOR":
      return "/instructor"
    default:
      return "/student"
  }
}
