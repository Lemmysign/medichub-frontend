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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const ROLES: (Role | "ALL")[] = ["ALL", "STUDENT", "INSTRUCTOR", "ADMIN"]
type StatusFilter = "ALL" | "ACTIVE" | "DISABLED"
const STATUSES: StatusFilter[] = ["ALL", "ACTIVE", "DISABLED"]
const PAGE_SIZE = 20

export function AdminUsersPage() {
  const [role, setRole] = useState<Role | "ALL">("ALL")
  const [status, setStatus] = useState<StatusFilter>("ALL")
  const [q, setQ] = useState("")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(0)

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
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRoleF(r)}
              className={"font-500 rounded-md px-3 py-1.5 text-sm transition-colors " + (role === r ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              {r === "ALL" ? "All roles" : r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusF(s)}
              className={"font-500 rounded-md px-3 py-1.5 text-sm transition-colors " + (status === s ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              {s === "ALL" ? "All status" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
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
    </>
  )
}
