import { useState } from "react"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import type { UserResponse } from "@/lib/types"
import { PageHeader } from "@/components/common"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export function AccountPage() {
  const { user, setUser } = useAuth()
  const [name, setName] = useState(user?.fullName ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [pw, setPw] = useState({ current: "", next: "" })
  const [busy, setBusy] = useState<string | null>(null)

  async function changeName() {
    setBusy("name")
    try {
      const res = await api.patch<UserResponse>("/account/name", { fullName: name })
      setUser(res.data)
      toast.success("Name updated")
    } catch (e) { toast.error(errorMessage(e)) } finally { setBusy(null) }
  }
  async function changeEmail() {
    setBusy("email")
    try {
      const res = await api.patch<UserResponse>("/account/email", { email })
      setUser(res.data)
      toast.success("Email updated")
    } catch (e) { toast.error(errorMessage(e)) } finally { setBusy(null) }
  }
  async function changePassword() {
    setBusy("pw")
    try {
      await api.patch("/account/password", { currentPassword: pw.current, newPassword: pw.next })
      setPw({ current: "", next: "" })
      toast.success("Password changed")
    } catch (e) { toast.error(errorMessage(e)) } finally { setBusy(null) }
  }

  return (
    <>
      <PageHeader title="Account settings" description="Manage your profile and security" />
      <div className="grid max-w-xl gap-6">
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full name</Label>
              <div className="flex gap-2">
                <Input value={name} onChange={(e) => setName(e.target.value)} />
                <Button onClick={changeName} disabled={busy === "name" || !name.trim()}>
                  {busy === "name" && <Loader2 className="mr-2 size-4 animate-spin" />} Save
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex gap-2">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Button onClick={changeEmail} disabled={busy === "email" || !email.trim()}>
                  {busy === "email" && <Loader2 className="mr-2 size-4 animate-spin" />} Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Change password</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Current password</Label>
              <Input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>New password</Label>
              <Input type="password" minLength={8} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
            </div>
            <Button onClick={changePassword} disabled={busy === "pw" || !pw.current || pw.next.length < 8}>
              {busy === "pw" && <Loader2 className="mr-2 size-4 animate-spin" />} Update password
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
