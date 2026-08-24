import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import { useAuth } from "@/context/AuthContext"
import type { CommentResponse, CourseResponse, InstructorDashboardResponse, PagedResponse } from "@/lib/types"
import { PageHeader, StatCard, CenteredSpinner, ErrorState } from "@/components/common"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, FileQuestion, GraduationCap, Plus, ArrowRight, Edit3, MessageSquare } from "lucide-react"

export function InstructorDashboardPage() {
  const { user } = useAuth()
  const dash = useApi(() => api.get<InstructorDashboardResponse>("/instructor/dashboard").then((r) => r.data), [])
  const courses = useApi(
    () => api.get<PagedResponse<CourseResponse>>("/instructor/courses", { params: { size: 4 } }).then((r) => r.data),
    [],
  )
  const qa = useApi(
    () => api.get<PagedResponse<CommentResponse>>("/instructor/questions", { params: { unansweredOnly: true, size: 4 } }).then((r) => r.data),
    [],
  )

  if (dash.loading) return <CenteredSpinner />
  if (dash.error) return <ErrorState message={dash.error} />
  const d = dash.data!
  const myCourses = courses.data?.content ?? []
  const questions = qa.data?.content ?? []

  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.fullName.split(" ")[0]}`}
        description="Your teaching overview"
        action={<Button asChild><Link to="/instructor/courses"><Plus className="mr-1 size-4" /> New course</Link></Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Courses" value={d.totalCourses} icon={BookOpen} accent="primary" />
        <StatCard label="Students enrolled" value={d.totalStudentsEnrolled} icon={Users} accent="success" />
        <StatCard label="Tests created" value={d.totalTests} icon={FileQuestion} accent="warning" />
        <StatCard label="Students tested" value={d.totalStudentsTested} icon={GraduationCap} accent="accent" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* My courses */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-700 text-sm">My courses</h2>
            <Link to="/instructor/courses" className="font-600 flex items-center gap-1 text-xs text-primary hover:underline">
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          {courses.loading ? (
            <CenteredSpinner />
          ) : myCourses.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No courses yet.{" "}
              <Link to="/instructor/courses" className="font-600 text-primary hover:underline">Create your first course</Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {myCourses.map((c) => (
                <Card key={c.id} className="flex gap-4 p-4">
                  <div className="size-14 shrink-0 overflow-hidden rounded-md bg-muted">
                    {c.thumbnailUrl ? (
                      <img src={c.thumbnailUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground"><BookOpen className="size-5" /></div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <div className="font-700 truncate text-sm">{c.title}</div>
                      <Badge variant={c.published ? "default" : "secondary"} className="shrink-0">
                        {c.published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <div className="mb-2 text-xs text-muted-foreground">{c.topicCount} topics</div>
                    <Link to={`/instructor/courses/${c.id}`} className="font-600 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <Edit3 className="size-3" /> Manage
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Q&A inbox */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-700 text-sm">Q&amp;A inbox</h2>
            <Link to="/instructor/questions" className="font-600 flex items-center gap-1 text-xs text-primary hover:underline">
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          {qa.loading ? (
            <CenteredSpinner />
          ) : questions.length === 0 ? (
            <Card className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
              <MessageSquare className="size-6 opacity-50" />
              No unanswered questions.
            </Card>
          ) : (
            <div className="space-y-2">
              {questions.map((q) => (
                <Link
                  key={q.id}
                  to="/instructor/questions"
                  className="block rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-destructive" />
                    <div className="min-w-0">
                      <div className="font-700 mb-0.5 line-clamp-2 text-xs leading-snug">{q.text}</div>
                      <div className="text-[10px] text-muted-foreground">{q.authorName} · {new Date(q.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="font-600 ml-4 mt-1 text-[10px] text-destructive">Needs reply</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
