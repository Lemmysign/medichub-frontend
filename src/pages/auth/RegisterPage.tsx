import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useAuth, homePathFor } from "@/context/AuthContext"
import { errorMessage } from "@/lib/api"
import type { Role } from "@/lib/types"
import { AuthShell } from "./AuthShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>("STUDENT")
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  function update(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        role,
      })
      toast.success("Account created")
      navigate(homePathFor(user.role), { replace: true })
    } catch (err) {
      toast.error(errorMessage(err, "Registration failed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join MedicHub Academy and start preparing today."
      quote={{
        text: "Everything I needed for the licensing exam in one place — video lessons, materials, and timed mocks.",
        author: "Dr. Yemi Adeyemi",
        meta: "Internal Medicine resident",
        initials: "YA",
      }}
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-700 text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Role selector — signup only */}
        <div>
          <p className="font-700 mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">I am signing up as</p>
          <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-1">
            {(["STUDENT", "INSTRUCTOR"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  "font-700 rounded-sm py-2 text-sm transition-colors",
                  role === r ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r === "STUDENT" ? "Student" : "Instructor"}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" required value={form.fullName} onChange={update("fullName")} placeholder="Jane Doe" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" required value={form.email} onChange={update("email")} placeholder="you@example.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" value={form.phone} onChange={update("phone")} placeholder="080..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPass ? "text" : "password"}
              required
              minLength={8}
              value={form.password}
              onChange={update("password")}
              placeholder="At least 8 characters"
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
          Create {role === "STUDENT" ? "student" : "instructor"} account {!loading && <ArrowRight className="ml-1 size-4" />}
        </Button>
      </form>
    </AuthShell>
  )
}
