import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import { useAuth } from "@/context/AuthContext"
import type { EnrolledCourseResponse, PagedResponse, StudentDashboardResponse, SubscriptionStatusResponse } from "@/lib/types"
import { PageHeader, StatCard, CenteredSpinner, ErrorState } from "@/components/common"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, GraduationCap, Trophy, Percent, ArrowRight, Play, ClipboardList, AlertCircle, CheckCircle2, Sparkles } from "lucide-react"

export function StudentDashboardPage() {
  const { user } = useAuth()
  const dash = useApi(() => api.get<StudentDashboardResponse>("/student/dashboard").then((r) => r.data), [])
  const sub = useApi(() => api.get<SubscriptionStatusResponse>("/student/subscription").then((r) => r.data), [])
  const courses = useApi(
    () => api.get<PagedResponse<EnrolledCourseResponse>>("/student/courses", { params: { size: 4 } }).then((r) => r.data),
    [],
  )

  if (dash.loading || sub.loading) return <CenteredSpinner />
  if (dash.error) return <ErrorState message={dash.error} onRetry={dash.reload} />

  const d = dash.data!
  const s = sub.data
  const enrolled = courses.data?.content ?? []

  return (
    <>
      <PageHeader title={`Welcome, ${user?.fullName.split(" ")[0]}`} description="Your learning at a glance" />

      {/* Subscription banner */}
      {sub.error ? (
        <Card className="mb-6 flex flex-col gap-3 border-border p-5 sm:flex-row sm:items-center">
          <AlertCircle className="size-5 shrink-0 text-muted-foreground" />
          <p className="flex-1 text-sm text-muted-foreground">We could not check your subscription status right now.</p>
          <Button size="sm" variant="outline" className="shrink-0" onClick={() => sub.reload()}>Try again</Button>
        </Card>
      ) : s?.active ? (
        <Card className="mb-6 flex flex-col gap-4 border-0 bg-primary p-5 text-primary-foreground sm:flex-row sm:items-center">
          <CheckCircle2 className="size-5 shrink-0 opacity-90" />
          <div className="flex-1">
            <p className="font-700 text-sm">
              Subscription active{s.endDate ? ` — renews ${new Date(s.endDate).toLocaleDateString()}` : ""}
            </p>
            <p className="text-xs opacity-80">All courses and mock exams are unlocked — keep going!</p>
          </div>
          <Button asChild variant="secondary" size="sm" className="shrink-0">
            <Link to="/student/subscription">Manage plan</Link>
          </Button>
        </Card>
      ) : (
        <Card className="mb-6 flex flex-col gap-4 overflow-hidden border-0 bg-gradient-to-br from-primary to-[#0e7a75] p-5 text-primary-foreground sm:flex-row sm:items-center">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <Sparkles className="size-5" />
          </span>
          <div className="flex-1">
            <p className="font-800 text-base">Unlock your full MDCN preparation</p>
            <p className="text-sm opacity-90">Subscribe to get every MCQ set, recall and mock exam, with a clear explanation behind each answer.</p>
          </div>
          <Button asChild variant="secondary" size="sm" className="font-700 shrink-0">
            <Link to="/student/subscription">See subscription options</Link>
          </Button>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Courses enrolled" value={d.coursesEnrolled} icon={BookOpen} accent="primary" />
        <StatCard label="Courses completed" value={d.coursesCompleted} icon={GraduationCap} accent="success" />
        <StatCard label="Tests taken" value={d.testsTaken} icon={Trophy} accent="warning" />
        <StatCard label="Average score" value={`${d.averageScorePercent}%`} icon={Percent} accent="accent" />
      </div>

      {/* Continue learning + quick actions */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-700 text-sm">Continue learning</h2>
            <Link to="/student/courses" className="font-600 flex items-center gap-1 text-xs text-primary hover:underline">
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          {courses.loading ? (
            <CenteredSpinner />
          ) : enrolled.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              You haven&apos;t started any courses yet.{" "}
              <Link to="/browse" className="font-600 text-primary hover:underline">Browse courses</Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {enrolled.map((c) => (
                <Link
                  key={c.courseId}
                  to={`/student/courses/${c.courseId}`}
                  className="group flex gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="size-16 shrink-0 overflow-hidden rounded-md bg-muted">
                    {c.thumbnailUrl ? (
                      <img src={c.thumbnailUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground"><BookOpen className="size-6" /></div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-700 mb-0.5 truncate text-sm">{c.title}</div>
                    <div className="mb-2 truncate text-xs text-muted-foreground">{c.instructorName}</div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${c.percentComplete}%` }} />
                      </div>
                      <span className="tabular font-700 text-xs text-muted-foreground">{c.completedTopics}/{c.totalTopics}</span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">{c.percentComplete}% complete</div>
                  </div>
                  <div className="flex items-center self-center">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Play className="ml-0.5 size-3.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <h2 className="mb-1 font-700 text-sm">Quick actions</h2>
          <Link
            to="/student/mock-exams"
            className="group flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <ClipboardList className="size-4" />
            </div>
            <div className="flex-1">
              <div className="font-700 text-xs">Take a mock exam</div>
              <div className="text-[10px] text-muted-foreground">Timed, exam-style practice</div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary" />
          </Link>
          <Link
            to="/browse"
            className="group flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-success/10 text-success transition-colors group-hover:bg-success group-hover:text-success-foreground">
              <BookOpen className="size-4" />
            </div>
            <div className="flex-1">
              <div className="font-700 text-xs">Browse the catalogue</div>
              <div className="text-[10px] text-muted-foreground">Find your next course</div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary" />
          </Link>
        </div>
      </div>
    </>
  )
}
