import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { TestResponse } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/common"
import { FileQuestion } from "lucide-react"

export function CourseTests({ courseId }: { courseId: number }) {
  const { data, loading, error } = useApi(
    () => api.get<TestResponse[]>(`/student/courses/${courseId}/tests`).then((r) => r.data),
    [courseId],
  )

  if (loading) return <Spinner />
  if (error || !data || data.length === 0) return null

  return (
    <div>
      <h3 className="mb-2 font-medium">Mock tests</h3>
      <Card className="divide-y p-0">
        {data.map((t) => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3">
            <FileQuestion className="size-4 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">{t.title}</p>
              <p className="text-xs text-muted-foreground">{t.questionCount} questions • pass {t.passMarkPercent}%</p>
            </div>
            <Button asChild size="sm">
              <Link to={`/student/courses/${courseId}/tests/${t.id}`}>Take test</Link>
            </Button>
          </div>
        ))}
      </Card>
    </div>
  )
}
