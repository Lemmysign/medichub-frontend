import { Navigate, Outlet } from "react-router-dom"
import { useAuth, homePathFor } from "@/context/AuthContext"
import type { Role } from "@/lib/types"
import { Loader2 } from "lucide-react"

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homePathFor(user.role)} replace />
  }

  return <Outlet />
}
