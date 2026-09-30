import { useState } from "react"
import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import { useSubjects } from "@/hooks/useSubjects"
import type { McqSummaryResponse, PagedResponse } from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState, EmptyState } from "@/components/common"
import { Pagination } from "@/components/ui/pagination"
import { ArrowUpRight, FileQuestion, ListChecks, Tag } from "lucide-react"

const selectCls =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"

/** Student-side MCQs — view-only question bank, works exactly like Recalls minus the year filter. */
export function StudentMcqsPage() {
  const subjects = useSubjects()
  const [subjectId, setSubjectId] = useState<number | "">("")
  const [page, setPage] = useState(0)

  const { data, loading, error } = useApi(
    () => api.get<PagedResponse<McqSummaryResponse>>("/student/mcqs", {
      params: { page, size: 12, subjectId: subjectId || undefined },
    }).then((r) => r.data),
    [page, subjectId],
  )
  const papers = data?.content ?? []

  return (
    <>
      <PageHeader
        title="MCQs"
        description="Subject-tagged question sets. Open one to read its questions, answers and explanations — no timing, no scoring."
      />

      {/* Filter — dropdown */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:max-w-xs">
        <div>
          <label className="mb-1 flex items-center gap-1 text-xs font-600 text-muted-foreground"><Tag className="size-3.5" /> Subject</label>
          <select className={selectCls} value={subjectId} onChange={(e) => { setSubjectId(e.target.value ? Number(e.target.value) : ""); setPage(0) }}>
            <option value="">All subjects</option>
            {(subjects.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? <CenteredSpinner /> : error ? <ErrorState message={error} /> : papers.length === 0 ? (
        <EmptyState title="No MCQs found" description="Try a different subject — or check back as more are added." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {papers.map((m) => (
            <Link
              key={m.id}
              to={`${m.id}`}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_14px_36px_-12px_rgba(12,42,46,0.28)]"
            >
              <span className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary via-primary/60 to-warning opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ListChecks className="size-[17px]" />
                </span>
              </div>

              <h3 className="font-800 mt-3 line-clamp-2 leading-snug tracking-tight transition-colors group-hover:text-primary">
                {m.title}
              </h3>

              {m.subjectName && (
                <span className="font-600 mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                  <Tag className="size-3" /> {m.subjectName}
                </span>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
                <span className="tabular flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileQuestion className="size-3.5" /> {m.questionCount} question{m.questionCount === 1 ? "" : "s"}
                </span>
                <span className="font-600 flex items-center gap-0.5 text-xs text-primary">
                  View
                  <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
      {data && <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />}
    </>
  )
}
