import { Link, useParams } from "react-router-dom"
import { api } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import { useAuth } from "@/context/AuthContext"
import type { CoursePreviewResponse } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CenteredSpinner, ErrorState } from "@/components/common"
import { CheckCircle2, PlayCircle, Lock } from "lucide-react"

export function CoursePreviewPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { data, loading, error } = useApi(
    () => api.get<CoursePreviewResponse>(`/public/courses/${id}`).then((r) => r.data),
    [id],
  )

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-10"><CenteredSpinner /></div>
  if (error) return <div className="mx-auto max-w-4xl px-4 py-10"><ErrorState message={error} /></div>
  if (!data) return null

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{data.title}</h1>
        <p className="mt-2 text-muted-foreground">by {data.instructorName}</p>
        {data.description && <p className="mt-4 leading-relaxed">{data.description}</p>}
        <div className="mt-6">
          {user?.role === "STUDENT" ? (
            <Button asChild size="lg">
              <Link to={`/student/courses/${data.id}`}>
                <PlayCircle className="mr-2 size-4" /> Start learning
              </Link>
            </Button>
          ) : user ? (
            <p className="text-sm text-muted-foreground">Signed in as {data.instructorName ? "a user" : ""}. Students can enrol in courses.</p>
          ) : (
            <Button asChild size="lg">
              <Link to="/register">
                <Lock className="mr-2 size-4" /> Subscribe to access
              </Link>
            </Button>
          )}
        </div>
      </div>

      <h2 className="mb-3 text-lg font-semibold">{data.topicCount} topics</h2>
      <Card className="divide-y p-0">
        {data.topics.map((t, i) => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3">
            <span className="w-6 text-sm text-muted-foreground">{i + 1}</span>
            {t.hasVideo ? (
              <PlayCircle className="size-4 text-primary" />
            ) : (
              <CheckCircle2 className="size-4 text-muted-foreground/40" />
            )}
            <span className="flex-1 text-sm">{t.title}</span>
          </div>
        ))}
        {data.topics.length === 0 && <div className="px-4 py-6 text-sm text-muted-foreground">No topics published yet.</div>}
      </Card>
    </div>
  )
}
