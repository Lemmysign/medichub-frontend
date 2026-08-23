import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { AuthShell } from "./AuthShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get("token") ?? ""
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post("/auth/reset-password", { token, newPassword })
      toast.success("Password reset. Please sign in.")
      navigate("/login", { replace: true })
    } catch (err) {
      toast.error(errorMessage(err, "Reset failed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Choose a new password" footer={<Link to="/login" className="font-medium text-primary hover:underline">Back to sign in</Link>}>
      {!token ? (
        <p className="text-sm text-destructive">This reset link is missing its token. Please request a new one.</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input id="newPassword" type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Reset password
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
