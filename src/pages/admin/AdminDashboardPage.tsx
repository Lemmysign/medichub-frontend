import { Link } from "react-router-dom"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { api } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { AdminMetricsResponse, PagedResponse, RevenueReportResponse, UserResponse } from "@/lib/types"
import { PageHeader, StatCard, CenteredSpinner, ErrorState, formatNaira } from "@/components/common"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, GraduationCap, FileQuestion, BadgeCheck, Banknote, ArrowRight } from "lucide-react"

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}
function nairaCompact(kobo: number) {
  const naira = kobo / 100
  if (naira >= 1_000_000) return `₦${(naira / 1_000_000).toFixed(1)}M`
  if (naira >= 1_000) return `₦${Math.round(naira / 1_000)}k`
  return `₦${naira}`
}

export function AdminDashboardPage() {
  const metrics = useApi(() => api.get<AdminMetricsResponse>("/admin/metrics").then((r) => r.data), [])
  const revenue = useApi(
    () => api.get<RevenueReportResponse>("/admin/metrics/revenue", { params: { granularity: "month" } })
      .then((r) => r.data)
      .catch(() => null),
    [],
  )
  const accounts = useApi(
    () => api.get<PagedResponse<UserResponse>>("/admin/users", { params: { size: 6 } }).then((r) => r.data),
    [],
  )

  if (metrics.loading) return <CenteredSpinner />
  if (metrics.error) return <ErrorState message={metrics.error} />
  const m = metrics.data!

  const chartData = (revenue.data?.buckets ?? []).map((b) => ({
    label: new Date(b.periodStart).toLocaleDateString("en-NG", { month: "short" }),
    naira: b.amountKobo / 100,
    kobo: b.amountKobo,
  }))

  return (
    <>
      <PageHeader title="Platform overview" description="Key metrics across MedicHub Academy" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Instructors" value={m.totalInstructors} icon={Users} accent="primary" />
        <StatCard label="Students" value={m.totalStudents} icon={GraduationCap} accent="success" />
        <StatCard label="Tests" value={m.totalTests} icon={FileQuestion} accent="warning" />
        <StatCard label="Active subscriptions" value={m.activeSubscriptions} icon={BadgeCheck} accent="accent" />
        <StatCard
          label="Revenue (total)"
          value={revenue.loading ? "…" : formatNaira(revenue.data?.totalKobo ?? 0)}
          icon={Banknote}
          accent="primary"
        />
      </div>

      {/* Revenue chart */}
      <Card className="mt-6 p-5">
        <div className="mb-4">
          <div className="font-700 text-sm">Revenue</div>
          <div className="text-xs text-muted-foreground">Monthly · Naira</div>
        </div>
        {revenue.loading ? (
          <CenteredSpinner />
        ) : chartData.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No revenue recorded yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => nairaCompact(Number(v) * 100)}
              />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 12 }}
                formatter={(v) => [formatNaira(Number(v) * 100), "Revenue"]}
              />
              <Area type="monotone" dataKey="naira" stroke="var(--primary)" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Recent accounts */}
      <Card className="mt-6 overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <div className="font-700 text-sm">Recent accounts</div>
            <div className="text-xs text-muted-foreground">Newest students and instructors</div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/users">View all <ArrowRight className="ml-1 size-3" /></Link>
          </Button>
        </div>
        {accounts.loading ? (
          <CenteredSpinner />
        ) : (accounts.data?.content ?? []).length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">No accounts yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(accounts.data?.content ?? []).map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="font-700 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] text-primary">
                        {initials(u.fullName)}
                      </div>
                      <span className="font-600 text-xs">{u.fullName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">{u.email}</TableCell>
                  <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={u.enabled ? "default" : "destructive"}>{u.enabled ? "Active" : "Disabled"}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  )
}
