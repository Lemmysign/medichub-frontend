import { useState } from "react"
import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { EnrolledCourseResponse, PagedResponse } from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState, EmptyState } from "@/components/common"
import { Pagination } from "@/components/ui/pagination"
import { BookOpen } from "lucide-react"

export function MyCoursesPage() {
  const [page, setPage] = useState(0)
  const { data, loading, error } = useApi(
    () => api.get<PagedResponse<EnrolledCourseResponse>>("/student/courses", { params: { page, size: 12 } }).then((r) => r.data),
    [page],
  )

  if (loading) return <CenteredSpinner />
  if (error) return <ErrorState message={error} />
  const courses = data?.content ?? []
  const total = data?.totalElements ?? courses.length

  return (
    <>
      <PageHeader title="My Courses" description={`${total} course${total === 1 ? "" : "s"} enrolled`} />
      {courses.length === 0 ? (
        <EmptyState title="You haven't opened any courses yet" description="Browse the catalogue and start learning." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {courses.map((c) => (
            <Link
              key={c.courseId}
              to={`/student/courses/${c.courseId}`}
              className="group overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="relative aspect-[16/7] w-full overflow-hidden bg-muted">
                {c.thumbnailUrl ? (
                  <img src={c.thumbnailUrl} alt="" className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground"><BookOpen className="size-8" /></div>
                )}
                {/* progress accent bar */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-black/10">
                  <div className="h-full bg-primary" style={{ width: `${c.percentComplete}%` }} />
                </div>
              </div>
              <div className="p-4">
                <div className="font-700 truncate">{c.title}</div>
                <div className="mt-0.5 truncate text-sm text-muted-foreground">{c.instructorName}</div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{c.completedTopics}/{c.totalTopics} topics</span>
                  <span className={"tabular font-800 " + (c.percentComplete === 100 ? "text-success" : "text-primary")}>{c.percentComplete}%</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      {data && <Pagination page={page} totalPages={data.totalPages} onPage={setPage} />}
    </>
  )
}
