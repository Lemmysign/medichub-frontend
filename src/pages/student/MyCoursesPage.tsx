import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { EnrolledCourseResponse, PagedResponse } from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState, EmptyState } from "@/components/common"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

export function MyCoursesPage() {
  const { data, loading, error } = useApi(
    () => api.get<PagedResponse<EnrolledCourseResponse>>("/student/courses", { params: { size: 50 } }).then((r) => r.data),
    [],
  )

  if (loading) return <CenteredSpinner />
  if (error) return <ErrorState message={error} />

  return (
    <>
      <PageHeader title="My courses" description="Pick up where you left off" />
      {!data || data.content.length === 0 ? (
        <EmptyState title="You haven't opened any courses yet" description="Browse the catalog and start learning." />
      ) : (
        <div className="grid gap-4">
          {data.content.map((c) => (
            <Card key={c.courseId} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="min-w-[220px] flex-1">
                <p className="font-medium">{c.title}</p>
                <p className="text-sm text-muted-foreground">{c.instructorName}</p>
                <div className="mt-3 flex items-center gap-3">
                  <Progress value={c.percentComplete} className="max-w-xs" />
                  <span className="text-sm text-muted-foreground">
                    {c.completedTopics}/{c.totalTopics} • {c.percentComplete}%
                  </span>
                </div>
              </div>
              <Button asChild>
                <Link to={`/student/courses/${c.courseId}`}>Continue</Link>
              </Button>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
