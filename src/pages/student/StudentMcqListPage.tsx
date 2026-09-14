import { Link } from "react-router-dom"
import { useState } from "react"
import { api } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import { useSubjects } from "@/hooks/useSubjects"
import type { MockExamSummaryResponse, PagedResponse } from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState, EmptyState } from "@/components/common"
import { SubjectFilter } from "@/pages/mock/MockExamsListPage"
import { Pagination } from "@/components/ui/pagination"
import { ChevronRight, FileQuestion, ListChecks, Tag } from "lucide-react"

/** Untimed, ungraded MCQ practice — same papers as Mock exam, opened in reveal-on-click mode. */
export function StudentMcqListPage() {
  const subjects = useSubjects()
  const [subjectId, setSubjectId] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const { data, loading, error } = useApi(
    () => api.get<PagedResponse<MockExamSummaryResponse>>("/student/mock-exams", { params: { page, size: 15, subjectId: subjectId ?? undefined } }).then((r) => r.data),
    [page, subjectId],
  )
  const papers = data?.content ?? []

  return (
    <>
      <PageHeader title="MCQ" description="Practice mode — no timer, no score. Tap an answer to see if you're right, with the explanation." />

      <SubjectFilter subjects={subjects.data ?? []} value={subjectId} onChange={(v) => { setSubjectId(v); setPage(0) }} />

      {loading ? <CenteredSpinner /> : error ? <ErrorState message={error} /> : papers.length === 0 ? (
        <EmptyState title="No MCQ sets available yet" description="Check back soon — new question sets are added regularly." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {papers.map((m) => (
            <Link
              key={m.id}
              to={`${m.id}`}
              className="group flex flex-col rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><ListChecks className="size-[17px]" /></span>
                {m.subjectName && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-600 text-accent-foreground">
                    <Tag className="size-3" /> {m.subjectName}
                  </span>
                )}
              </div>
              <h3 className="font-800 mt-3 line-clamp-2 leading-snug tracking-tight transition-colors group-hover:text-primary">{m.title}</h3>
              <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
                <span className="tabular flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileQuestion className="size-3.5" /> {m.questionCount} question{m.questionCount === 1 ? "" : "s"}
                </span>
                <span className="font-600 flex items-center gap-0.5 text-xs text-primary">Practice <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span>
              </div>
            </Link>
          ))}
        </div>
      )}
      {data && <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />}
    </>
  )
}
