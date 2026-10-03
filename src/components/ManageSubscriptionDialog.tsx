import { useEffect, useState } from "react"
import { toast } from "sonner"
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"
import { api, errorMessage } from "@/lib/api"
import type { AdminStudentSubscriptionResponse, UserResponse } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const PRESETS = [30, 60, 90, 180, 365]
const MAX_DAYS = 365
const DAY_MS = 24 * 60 * 60 * 1000

function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—"
}

interface Props {
  student: UserResponse | null
  onClose: () => void
}

/**
 * Admin-only. Manually subscribes a student for N days (e.g. a bank transfer, or a Paystack payment
 * that was verified in the Paystack dashboard but never activated), or ends their access immediately.
 */
export function ManageSubscriptionDialog({ student, onClose }: Props) {
  const [sub, setSub] = useState<AdminStudentSubscriptionResponse | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [days, setDays] = useState("30")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState<"grant" | "revoke" | null>(null)
  const [confirmingRevoke, setConfirmingRevoke] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)

  const studentId = student?.id
  useEffect(() => {
    setSub(null)
    setLoadError(null)
    setDays("30")
    setNote("")
    setConfirmingRevoke(false)
    setWarning(null)
    if (studentId == null) return
    let cancelled = false
    api
      .get<AdminStudentSubscriptionResponse>(`/admin/students/${studentId}/subscription`)
      .then((r) => { if (!cancelled) setSub(r.data) })
      .catch((e) => { if (!cancelled) setLoadError(errorMessage(e, "Could not load subscription")) })
    return () => { cancelled = true }
  }, [studentId])

  const n = Number(days)
  const daysValid = Number.isInteger(n) && n >= 1 && n <= MAX_DAYS
  // Mirrors the server: extends from the current end date while active, otherwise starts now.
  const base = sub?.active && sub.endDate ? new Date(sub.endDate).getTime() : Date.now()
  const newEnd = daysValid ? new Date(base + n * DAY_MS).toISOString() : null

  async function grant() {
    if (!student || !daysValid) return
    setBusy("grant")
    try {
      const res = await api.post<AdminStudentSubscriptionResponse>(
        `/admin/students/${student.id}/subscription/grant`,
        { days: n, note: note.trim() || null },
      )
      setSub(res.data)
      setNote("")
      setWarning(null)
      toast.success(`${student.fullName} is subscribed until ${fmtDate(res.data.endDate)}`)
    } catch (e) {
      toast.error(errorMessage(e, "Could not subscribe this student"))
    } finally {
      setBusy(null)
    }
  }

  async function revoke() {
    if (!student) return
    setBusy("revoke")
    try {
      const res = await api.post<AdminStudentSubscriptionResponse>(
        `/admin/students/${student.id}/subscription/revoke`,
        { note: note.trim() || null },
      )
      setSub(res.data)
      setNote("")
      setConfirmingRevoke(false)
      setWarning(res.data.warning)
      toast.success(`${student.fullName}'s subscription was ended`)
    } catch (e) {
      toast.error(errorMessage(e, "Could not end this subscription"))
    } finally {
      setBusy(null)
    }
  }

  return (
    <Dialog open={student != null} onOpenChange={(open) => { if (!open && !busy) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage subscription</DialogTitle>
          <DialogDescription>
            {student?.fullName} · {student?.email}
          </DialogDescription>
        </DialogHeader>

        {loadError ? (
          <p className="text-sm text-destructive">{loadError}</p>
        ) : !sub ? (
          <div className="flex justify-center py-6"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current status</span>
                <Badge variant={sub.active ? "default" : "secondary"}>
                  {sub.active ? "Active" : sub.status ? sub.status.charAt(0) + sub.status.slice(1).toLowerCase() : "No subscription"}
                </Badge>
              </div>
              {sub.endDate && (
                <p className="mt-2 text-muted-foreground">
                  {sub.active ? "Access ends" : "Last access ended"} <span className="font-medium text-foreground">{fmtDate(sub.endDate)}</span>
                  {sub.active && sub.autoRenews && " · renews automatically via Paystack"}
                </p>
              )}
            </div>

            {warning && (
              <div className="flex gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm" role="alert">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <p>{warning}</p>
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="sub-days">Subscribe for how many days?</Label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((d) => (
                  <Button
                    key={d}
                    type="button"
                    size="sm"
                    variant={n === d ? "default" : "outline"}
                    onClick={() => setDays(String(d))}
                    disabled={busy != null}
                  >
                    {d} days
                  </Button>
                ))}
              </div>
              <Input
                id="sub-days"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_DAYS}
                value={days}
                onChange={(e) => setDays(e.target.value)}
                aria-invalid={!daysValid}
                disabled={busy != null}
              />
              {!daysValid && <p className="text-xs text-destructive">Enter a whole number of days between 1 and {MAX_DAYS}.</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sub-note">Note <span className="font-normal text-muted-foreground">(optional, kept in the audit log)</span></Label>
              <Textarea
                id="sub-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                placeholder="e.g. Bank transfer received 2 Oct, verified in Paystack dashboard"
                disabled={busy != null}
              />
            </div>

            <Button className="w-full" onClick={grant} disabled={!daysValid || busy != null}>
              {busy === "grant" ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />}
              {sub.active ? `Extend by ${daysValid ? n : "…"} days` : `Subscribe for ${daysValid ? n : "…"} days`}
              {newEnd && <span className="ml-1 font-normal opacity-80">· until {fmtDate(newEnd)}</span>}
            </Button>

            {sub.active && (
              <div className="border-t pt-4">
                {confirmingRevoke ? (
                  <div className="space-y-3 rounded-md border border-destructive/40 bg-destructive/5 p-3">
                    <p className="text-sm">
                      <span className="font-medium">End {student?.fullName}'s subscription now?</span> Access is removed immediately, and any
                      automatic Paystack billing is stopped.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="destructive" className="flex-1" onClick={revoke} disabled={busy != null}>
                        {busy === "revoke" && <Loader2 className="mr-2 size-4 animate-spin" />}
                        Yes, end access now
                      </Button>
                      <Button variant="outline" onClick={() => setConfirmingRevoke(false)} disabled={busy != null}>
                        Keep
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setConfirmingRevoke(true)}
                    disabled={busy != null}
                  >
                    Unsubscribe this student
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
