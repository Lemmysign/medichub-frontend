import { api } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { AdminMetricsResponse } from "@/lib/types"
import { PageHeader, StatCard, CenteredSpinner, ErrorState, formatNaira } from "@/components/common"
import { Users, GraduationCap, FileQuestion, BadgeCheck, Banknote } from "lucide-react"

interface RevenueReport {
  totalKobo: number
}

export function AdminDashboardPage() {
  const metrics = useApi(() => api.get<AdminMetricsResponse>("/admin/metrics").then((r) => r.data), [])
  const revenue = useApi(
    () => api.get<RevenueReport>("/admin/metrics/revenue", { params: { granularity: "day" } }).then((r) => r.data).catch(() => ({ totalKobo: 0 })),
    [],
  )

  if (metrics.loading) return <CenteredSpinner />
  if (metrics.error) return <ErrorState message={metrics.error} />
  const m = metrics.data!

  return (
    <>
      <PageHeader title="Platform overview" description="Key metrics across MedicHub Academy" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Instructors" value={m.totalInstructors} icon={Users} />
        <StatCard label="Students" value={m.totalStudents} icon={GraduationCap} />
        <StatCard label="Tests on platform" value={m.totalTests} icon={FileQuestion} />
        <StatCard label="Active subscriptions" value={m.activeSubscriptions} icon={BadgeCheck} />
        <StatCard
          label="Revenue (last 30 days)"
          value={revenue.loading ? "…" : formatNaira(revenue.data?.totalKobo ?? 0)}
          icon={Banknote}
        />
      </div>
    </>
  )
}
