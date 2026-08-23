import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { CourseResponse, PagedResponse } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CenteredSpinner, EmptyState, ErrorState } from "@/components/common"
import { BookOpen, GraduationCap } from "lucide-react"

export function CourseCatalog() {
  const { data, loading, error } = useApi(
    () => api.get<PagedResponse<CourseResponse>>("/public/courses", { params: { size: 24 } }).then((r) => r.data),
    [],
  )

  if (loading) return <CenteredSpinner />
  if (error) return <ErrorState message={error} />
  if (!data || data.content.length === 0)
    return <EmptyState title="No courses yet" description="Published courses will appear here." />

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {data.content.map((c) => (
        <Link key={c.id} to={`/courses/${c.id}`}>
          <Card className="h-full overflow-hidden pt-0 transition-shadow hover:shadow-md">
            <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-primary/15 to-accent">
              {c.thumbnailUrl ? (
                <img src={c.thumbnailUrl} alt={c.title} className="size-full object-cover" />
              ) : (
                <GraduationCap className="size-10 text-primary/40" />
              )}
            </div>
            <CardHeader>
              <CardTitle className="line-clamp-2 text-base">{c.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="line-clamp-1">{c.instructorName}</span>
              <Badge variant="secondary" className="gap-1">
                <BookOpen className="size-3" /> {c.topicCount}
              </Badge>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
