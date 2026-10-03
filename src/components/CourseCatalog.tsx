import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { CourseResponse, PagedResponse } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import { CenteredSpinner, EmptyState, ErrorState } from "@/components/common"
import { BookOpen, GraduationCap, Search } from "lucide-react"

/**
 * Shared published-course grid. Public landing links to the public preview;
 * the student Browse page passes {@link hrefFor} to open the in-app player and
 * {@link showSearch} for the search field.
 */
export function CourseCatalog({
  hrefFor = (id: number) => `/courses/${id}`,
  showSearch = false,
}: {
  hrefFor?: (id: number) => string
  showSearch?: boolean
}) {
  const [page, setPage] = useState(0)
  const { data, loading, error } = useApi(
    () => api.get<PagedResponse<CourseResponse>>("/public/courses", { params: { page, size: 12 } }).then((r) => r.data),
    [page],
  )
  const [q, setQ] = useState("")

  const courses = data?.content ?? []
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return courses
    return courses.filter(
      (c) => c.title.toLowerCase().includes(term) || c.instructorName.toLowerCase().includes(term),
    )
  }, [courses, q])

  if (loading) return <CenteredSpinner />
  if (error) return <ErrorState message={error} />
  if (courses.length === 0)
    return <EmptyState title="No courses yet" description="Published courses will appear here." />

  return (
    <div>
      {showSearch && (
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search courses or instructors…"
            className="h-11 pl-10"
          />
        </div>
      )}

      <p className="mb-4 text-sm text-muted-foreground">
        Showing {filtered.length} course{filtered.length === 1 ? "" : "s"}
      </p>

      {filtered.length === 0 ? (
        <EmptyState title="No matches" description="Try a different search." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Link
              key={c.id}
              to={hrefFor(c.id)}
              className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-muted">
                {c.thumbnailUrl ? (
                  <img src={c.thumbnailUrl} alt="" className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/15 to-accent">
                    <GraduationCap className="size-10 text-primary/40" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="font-700 line-clamp-2">{c.title}</div>
                <div className="mt-0.5 truncate text-sm text-muted-foreground">{c.instructorName}</div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <BookOpen className="size-3.5" /> {c.topicCount} lesson{c.topicCount === 1 ? "" : "s"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination applies to the full catalogue; hidden while a client-side search is active. */}
      {!q.trim() && data && <Pagination page={page} totalPages={data.totalPages} onPage={setPage} />}
    </div>
  )
}
