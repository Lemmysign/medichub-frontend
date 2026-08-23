import { Link, Outlet, useNavigate } from "react-router-dom"
import { useAuth, homePathFor } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { GraduationCap } from "lucide-react"

export function PublicLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-primary">
            <GraduationCap className="size-6" />
            <span>MedicHub Academy</span>
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <Button onClick={() => navigate(homePathFor(user.role))}>Go to dashboard</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/login")}>
                  Sign in
                </Button>
                <Button onClick={() => navigate("/register")}>Get started</Button>
              </>
            )}
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
