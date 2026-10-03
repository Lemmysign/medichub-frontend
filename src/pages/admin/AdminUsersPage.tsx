import { useState } from "react"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { PagedResponse, Role, UserResponse } from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState, EmptyState } from "@/components/common"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Pagination } from "@/components/ui/pagination"
import { ManageSubscriptionDialog } from "@/components/ManageSubscriptionDialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type StatusFilter = "ALL" | "ACTIVE" | "DISABLED"
const PAGE_SIZE = 20
const selectCls =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"

export function AdminUsersPage() {
  const [role, setRole] = useState<Role | "ALL">("ALL")
  const [status, setStatus] = useState<StatusFilter>("ALL")
  const [q, setQ] = useState("")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(0)
  const [managing, setManaging] = useState<UserResponse | null>(null)

  const { data, loading, error, reload } = useApi(
    () =>
      api
        .get<PagedResponse<UserResponse>>("/admin/users", {
          params: {
            page,
            size: PAGE_SIZE,
            ...(role !== "ALL" ? { role } : {}),
            ...(status !== "ALL" ? { enabled: status === "ACTIVE" } : {}),
            ...(query ? { q: query } : {}),
          },
        })
        .then((r) => r.data),
    [role, status, query, page],
  )

  // Changing any filter returns to the first page.
  function setRoleF(r: Role | "ALL") { setRole(r); setPage(0) }
  function setStatusF(s: StatusFilter) { setStatus(s); setPage(0) }
  function search(term: string) { setQuery(term); setPage(0) }

  async function setEnabled(u: UserResponse, enabled: boolean) {
    try {
      await api.patch(`/admin/users/${u.id}/enabled`, null, { params: { enabled } })
      toast.success(`${u.fullName} ${enabled ? "enabled" : "disabled"}`)
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <>
      <PageHeader title="Accounts" description="Manage students and instructors" />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select value={role} onChange={(e) => setRoleF(e.target.value as Role | "ALL")} className={selectCls} aria-label="Filter by role">
          <option value="ALL">All roles</option>
          <option value="STUDENT">Student</option>
          <option value="INSTRUCTOR">Instructor</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select value={status} onChange={(e) => setStatusF(e.target.value as StatusFilter)} className={selectCls} aria-label="Filter by status">
          <option value="ALL">All status</option>
          <option value="ACTIVE">Active</option>
          <option value="DISABLED">Disabled</option>
        </select>
        <form className="flex flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); search(q.trim()) }}>
          <Input placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <Button type="submit" variant="outline">Search</Button>
        </form>
      </div>

      {loading ? <CenteredSpinner /> : error ? <ErrorState message={error} /> : !data || data.content.length === 0 ? (
        <EmptyState title="No accounts found" />
      ) : (
        <>
          <Card className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead className="text-right">Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.fullName}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{u.email}</TableCell>
                    <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={u.enabled ? "default" : "destructive"}>{u.enabled ? "Active" : "Disabled"}</Badge>
                    </TableCell>
                    <TableCell>
                      {u.role === "STUDENT" ? (
                        <Button size="sm" variant="outline" onClick={() => setManaging(u)}>Manage</Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {u.role === "ADMIN" ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <Switch
                          checked={u.enabled}
                          onCheckedChange={(v) => setEnabled(u, v)}
                          aria-label={u.enabled ? `Disable ${u.fullName}` : `Enable ${u.fullName}`}
                          className="ml-auto"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />
        </>
      )}

      <ManageSubscriptionDialog student={managing} onClose={() => setManaging(null)} />
    </>
  )
}
