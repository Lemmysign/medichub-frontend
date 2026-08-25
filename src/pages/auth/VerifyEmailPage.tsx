import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useAuth, homePathFor } from "@/context/AuthContext"
import { errorMessage } from "@/lib/api"
import { AuthShell } from "./AuthShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, Loader2, MailCheck } from "lucide-react"

export function VerifyEmailPage() {
  const { verifyOtp, resendOtp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const initialEmail = (location.state as { email?: string } | null)?.email ?? ""

  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await verifyOtp(email.trim(), code.trim())
      if (res.pendingApproval) {
        toast.success("Email verified")
        navigate("/pending-approval", { replace: true })
      } else if (res.auth) {
        toast.success("Email verified — welcome!")
        navigate(homePathFor(res.auth.user.role), { replace: true })
      }
    } catch (err) {
      toast.error(errorMessage(err, "Verification failed"))
    } finally {
      setLoading(false)
    }
  }

  async function onResend() {
    if (!email.trim()) {
      toast.error("Enter your email first")
      return
    }
    setResending(true)
    try {
      await resendOtp(email.trim())
      toast.success("A new code is on its way")
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't resend the code"))
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthShell
      title="Verify your email"
      subtitle="Enter the 6-digit code we sent to your inbox to activate your account."
      quote={{
        text: "The recalls and timed mocks made exam day feel like just another practice session.",
        author: "Dr. Amara Okonkwo",
        meta: "MDCN Assessment",
        initials: "AO",
      }}
      footer={
        <>
          Entered the wrong email?{" "}
          <Link to="/register" className="font-700 text-primary hover:underline">
            Sign up again
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="mb-2 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
          <MailCheck className="size-5 shrink-0 text-primary" />
          <span>We sent a code to <span className="font-600 text-foreground">{email || "your email"}</span>. It expires in 10 minutes.</span>
        </div>

        {!initialEmail && (
          <div className="space-y-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="text-center text-2xl font-700 tracking-[0.5em]"
          />
        </div>

        <Button type="submit" className="font-700 w-full" disabled={loading || code.length !== 6}>
          {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Verify {!loading && <ArrowRight className="ml-1 size-4" />}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          Didn't get it?{" "}
          <button type="button" onClick={onResend} disabled={resending} className="font-700 text-primary hover:underline disabled:opacity-60">
            {resending ? "Sending…" : "Resend code"}
          </button>
        </div>
      </form>
    </AuthShell>
  )
}
