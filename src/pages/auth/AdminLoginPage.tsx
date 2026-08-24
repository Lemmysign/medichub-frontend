import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { errorMessage } from "@/lib/api"
import { AuthShell } from "./AuthShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react"

/** Separate admin portal (no self-signup). Only ADMIN accounts may proceed. */
export function AdminLoginPage() {
  const { login, logout } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(email.trim(), password)
      if (user.role !== "ADMIN") {
        await logout()
        toast.error("This account is not an administrator")
        return
      }
      toast.success(`Welcome back, ${user.fullName.split(" ")[0]}`)
      navigate("/admin", { replace: true })
    } catch (err) {
      toast.error(errorMessage(err, "Login failed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Admin sign in" subtitle="Access the MedicHub Academy back office." variant="admin">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@medichubacademy.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
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
