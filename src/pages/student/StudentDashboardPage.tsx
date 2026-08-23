import { api } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import { useAuth } from "@/context/AuthContext"
import type { StudentDashboardResponse, SubscriptionStatusResponse } from "@/lib/types"
import { PageHeader, StatCard, CenteredSpinner, ErrorState } from "@/components/common"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { BookOpen, GraduationCap, Trophy, Percent } from "lucide-react"

export function StudentDashboardPage() {
  const { user } = useAuth()
  const dash = useApi(() => api.get<StudentDashboardResponse>("/student/dashboard").then((r) => r.data), [])
  const sub = useApi(() => api.get<SubscriptionStatusResponse>("/student/subscription").then((r) => r.data), [])

  if (dash.loading || sub.loading) return <CenteredSpinner />
  if (dash.error) return <ErrorState message={dash.error} />

  const d = dash.data!
  const s = sub.data

  return (
    <>
      <PageHeader title={`Welcome, ${user?.fullName.split(" ")[0]}`} description="Your learning at a glance" />

      {s && !s.active && (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 border-primary/30 bg-primary/5 p-5">
          <div>
            <p className="font-medium">You don&apos;t have an active subscription</p>
            <p className="text-sm text-muted-foreground">Subscribe to unlock every course, test, and material.</p>
          </div>
          <Button asChild>
            <Link to="/student/subscription">View plans</Link>
          </Button>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Courses enrolled" value={d.coursesEnrolled} icon={BookOpen} />
        <StatCard label="Courses completed" value={d.coursesCompleted} icon={GraduationCap} />
        <StatCard label="Tests taken" value={d.testsTaken} icon={Trophy} />
        <StatCard label="Average score" value={`${d.averageScorePercent}%`} icon={Percent} />
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button asChild variant="outline">
          <Link to="/browse">Browse courses</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/student/courses">My courses</Link>
        </Button>
        {s?.active && <Badge className="bg-success text-white">Subscription active</Badge>}
      </div>
    </>
  )
}
