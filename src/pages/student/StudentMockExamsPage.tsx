import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import { useSubjects } from "@/hooks/useSubjects"
import type { MockExamSummaryResponse, PagedResponse } from "@/lib/types"
import { useState } from "react"
import { PageHeader, StatCard, CenteredSpinner, ErrorState, EmptyState } from "@/components/common"
import { SubjectFilter } from "@/pages/mock/MockExamsListPage"
import { Pagination } from "@/components/ui/pagination"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClipboardList, Clock, FileQuestion, Tag, Target, History, ChevronRight, TrendingUp, Trophy } from "lucide-react"

export function StudentMockExamsPage() {
  const subjects = useSubjects()
  const [subjectId, setSubjectId] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const { data, loading, error } = useApi(
    () => api.get<PagedResponse<MockExamSummaryResponse>>("/student/mock-exams", { params: { page, size: 15, subjectId: subjectId ?? undefined } }).then((r) => r.data),
    [page, subjectId],
  )

  const mocks = data?.content ?? []
  const examsTaken = mocks.reduce((sum, m) => sum + m.attemptCount, 0)
  const bestScore = mocks.reduce((max, m) => Math.max(max, m.bestScorePercent ?? 0), 0)
  const attempted = mocks.filter((m) => m.attemptCount > 0)
  const passRate = attempted.length
    ? Math.round((attempted.filter((m) => (m.bestScorePercent ?? 0) >= m.passMarkPercent).length / attempted.length) * 100)
    : 0

  return (
    <>
      <PageHeader title="Mock exam" description="Full, timed, auto-graded papers under exam conditions — filter by subject." />

      <SubjectFilter subjects={subjects.data ?? []} value={subjectId} onChange={(v) => { setSubjectId(v); setPage(0) }} />

      {loading ? <CenteredSpinner /> : error ? <ErrorState message={error} /> : mocks.length === 0 ? (
        <EmptyState title="No MCQ exams available yet" description="Check back soon — new exams are added regularly." />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Exams taken" value={examsTaken} icon={ClipboardList} accent="primary" />
            <StatCard label="Best score" value={`${bestScore}%`} icon={TrendingUp} accent="success" />
            <StatCard label="Pass rate" value={`${passRate}%`} icon={Target} accent="warning" />
          </div>

          <div className="space-y-4">
            {mocks.map((m) => {
              const best = m.bestScorePercent
              const passed = best != null && best >= m.passMarkPercent
              return (
                <Card key={m.id} className="p-5">
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <ClipboardList className="size-5" />
                    </div>
                    <div className="min-w-[220px] flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-700">{m.title}</p>
                        {m.subjectName && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-600 text-accent-foreground">
                            <Tag className="size-3" /> {m.subjectName}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><FileQuestion className="size-4" /> {m.questionCount} questions</span>
                        <span className="flex items-center gap-1"><Clock className="size-4" /> {m.durationMinutes ? `${m.durationMinutes} min` : "Untimed"}</span>
                        <span className="flex items-center gap-1"><Target className="size-4" /> Pass mark: {m.passMarkPercent}%</span>
                      </div>
                      {best != null ? (
                        <div className="mt-3 flex items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div className={"h-full rounded-full " + (passed ? "bg-success" : "bg-primary")} style={{ width: `${best}%` }} />
                          </div>
                          <span className="flex items-center gap-1 whitespace-nowrap text-sm">
                            <span className="text-muted-foreground">Best:</span>
                            <span className={"tabular font-800 " + (passed ? "text-success" : "text-primary")}>{best}%</span>
                            {passed && <Trophy className="size-4 text-warning" />}
                          </span>
                        </div>
                      ) : (
                        <p className="mt-3 text-xs text-muted-foreground">Not attempted yet</p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">{m.attemptCount} attempt{m.attemptCount === 1 ? "" : "s"}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 self-center">
                      {m.attemptCount > 0 && (
                        <Button asChild variant="outline" size="sm">
                          <Link to={`${m.id}`}><History className="mr-1 size-4" /> History</Link>
                        </Button>
                      )}
                      <Button asChild size="sm">
                        <Link to={`${m.id}`}>{m.attemptCount > 0 ? "Retake" : "Start"} <ChevronRight className="ml-1 size-4" /></Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
          {data && <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />}
        </>
      )}
    </>
  )
}
