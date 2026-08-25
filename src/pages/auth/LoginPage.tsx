import { useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useAuth, homePathFor } from "@/context/AuthContext"
import { errorMessage, errorCode } from "@/lib/api"
import { AuthShell } from "./AuthShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react"

export function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  // Already signed in? Skip the form and go straight to the dashboard.
  if (user) return <Navigate to={homePathFor(user.role)} replace />

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(email.trim(), password)
      toast.success(`Welcome back, ${user.fullName.split(" ")[0]}`)
      navigate(homePathFor(user.role), { replace: true })
    } catch (err) {
      const code = errorCode(err)
      if (code === "EMAIL_NOT_VERIFIED") {
        toast.message("Please verify your email to continue")
        navigate("/verify-email", { state: { email: email.trim() } })
      } else if (code === "INSTRUCTOR_PENDING") {
        navigate("/pending-approval")
      } else {
        toast.error(errorMessage(err, "Login failed"))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your account to continue studying."
      quote={{
        text: "The mock exams alone are worth the subscription. Felt like I'd sat the real exam twice before exam day.",
        author: "Dr. Chisom Obi",
        meta: "MDCN Licensing, First attempt",
        initials: "CO",
      }}
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-700 text-primary hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="font-600 text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPass ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <Button type="submit" className="font-700 w-full" disabled={loading}>
          {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Sign in {!loading && <ArrowRight className="ml-1 size-4" />}
        </Button>
      </form>
    </AuthShell>
  )
}
