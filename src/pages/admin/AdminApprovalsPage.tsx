import { useState } from "react"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { PagedResponse, PendingInstructorResponse } from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState, EmptyState } from "@/components/common"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/ui/pagination"
import { Check, GraduationCap, Loader2, Mail, Phone, X } from "lucide-react"

export function AdminApprovalsPage() {
  const [page, setPage] = useState(0)
  const { data, loading, error, reload } = useApi(
    () => api.get<PagedResponse<PendingInstructorResponse>>("/admin/instructors/pending", { params: { page, size: 12 } }).then((r) => r.data),
    [page],
  )
  const [busy, setBusy] = useState<number | null>(null)

  async function act(u: PendingInstructorResponse, action: "approve" | "reject") {
    if (action === "reject" && !confirm(`Reject and disable ${u.fullName}'s instructor account?`)) return
    setBusy(u.id)
    try {
      await api.post(`/admin/instructors/${u.id}/${action}`)
      toast.success(action === "approve" ? `${u.fullName} approved` : `${u.fullName} rejected`)
      reload()
    } catch (e) { toast.error(errorMessage(e)) } finally { setBusy(null) }
  }

  const pending = data?.content ?? []

  return (
    <>
      <PageHeader title="Instructor Approvals" description="Review and approve instructors before they can sign in and publish content." />

      {loading ? <CenteredSpinner /> : error ? <ErrorState message={error} /> : pending.length === 0 ? (
        <EmptyState title="No pending instructors" description="New instructor sign-ups awaiting approval will appear here." />
      ) : (
        <div className="space-y-3">
          {pending.map((u) => (
            <Card key={u.id} className="flex flex-wrap items-center gap-4 p-5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <GraduationCap className="size-5" />
              </div>
              <div className="min-w-[220px] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-700">{u.fullName}</p>
                  <Badge variant={u.emailVerified ? "default" : "secondary"}>
                    {u.emailVerified ? "Email verified" : "Email unverified"}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Mail className="size-4" /> {u.email}</span>
                  {u.phone && <span className="flex items-center gap-1"><Phone className="size-4" /> {u.phone}</span>}
                  <span>Registered {new Date(u.registeredAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => act(u, "reject")} disabled={busy === u.id}>
                  <X className="mr-1 size-4 text-destructive" /> Reject
                </Button>
                <Button size="sm" onClick={() => act(u, "approve")} disabled={busy === u.id}>
                  {busy === u.id ? <Loader2 className="mr-1 size-4 animate-spin" /> : <Check className="mr-1 size-4" />} Approve
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {data && <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />}
    </>
  )
}
