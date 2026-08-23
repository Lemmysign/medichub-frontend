import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { MockExamSummaryResponse, PagedResponse } from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState, EmptyState } from "@/components/common"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, FileQuestion } from "lucide-react"

export function StudentMockExamsPage() {
  const { data, loading, error } = useApi(
    () => api.get<PagedResponse<MockExamSummaryResponse>>("/student/mock-exams", { params: { size: 50 } }).then((r) => r.data),
    [],
  )

  return (
    <>
      <PageHeader title="Mock Exams" description="Timed practice exams — included with your subscription" />
      {loading ? <CenteredSpinner /> : error ? <ErrorState message={error} /> : !data || data.content.length === 0 ? (
        <EmptyState title="No mock exams available yet" description="Check back soon — new exams are added regularly." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.content.map((m) => (
            <Card key={m.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{m.title}</p>
                {m.bestScorePercent != null && (
                  <Badge variant={m.bestScorePercent >= m.passMarkPercent ? "default" : "secondary"}>
                    Best {m.bestScorePercent}%
                  </Badge>
                )}
              </div>
              {m.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{m.description}</p>}
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><FileQuestion className="size-4" /> {m.questionCount} questions</span>
                <span className="flex items-center gap-1"><Clock className="size-4" /> {m.durationMinutes} min</span>
                <span>pass {m.passMarkPercent}%</span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{m.attemptCount} attempt{m.attemptCount === 1 ? "" : "s"}</span>
                <Button asChild size="sm"><Link to={`${m.id}`}>{m.attemptCount > 0 ? "Retake" : "Start"}</Link></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
