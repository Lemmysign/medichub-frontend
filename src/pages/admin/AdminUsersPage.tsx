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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const ROLES: (Role | "ALL")[] = ["ALL", "STUDENT", "INSTRUCTOR", "ADMIN"]

export function AdminUsersPage() {
  const [role, setRole] = useState<Role | "ALL">("ALL")
  const [q, setQ] = useState("")
  const [query, setQuery] = useState("")

  const { data, loading, error, reload } = useApi(
    () =>
      api
        .get<PagedResponse<UserResponse>>("/admin/users", {
          params: { size: 50, ...(role !== "ALL" ? { role } : {}), ...(query ? { q: query } : {}) },
        })
        .then((r) => r.data),
    [role, query],
  )

  async function setEnabled(u: UserResponse, enabled: boolean) {
    try {
      await api.patch(`/admin/users/${u.id}/enabled`, null, { params: { enabled } })
      toast.success(`${u.fullName} ${enabled ? "enabled" : "disabled"}`)
      reload()
    } catch (e) { toast.error(errorMessage(e)) }
  }

  return (
    <>
      <PageHeader title="Accounts" description="Manage students and instructors" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={"rounded-md px-3 py-1.5 text-sm font-medium " + (role === r ? "bg-background shadow-sm" : "text-muted-foreground")}
            >
              {r === "ALL" ? "All" : r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => { e.preventDefault(); setQuery(q.trim()) }}
        >
          <Input placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <Button type="submit" variant="outline">Search</Button>
        </form>
      </div>

      {loading ? <CenteredSpinner /> : error ? <ErrorState message={error} /> : !data || data.content.length === 0 ? (
        <EmptyState title="No accounts found" />
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.content.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={u.enabled ? "default" : "destructive"}>{u.enabled ? "Active" : "Disabled"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {u.role !== "ADMIN" && (
                      <Button size="sm" variant={u.enabled ? "outline" : "default"} onClick={() => setEnabled(u, !u.enabled)}>
                        {u.enabled ? "Disable" : "Enable"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  )
}
