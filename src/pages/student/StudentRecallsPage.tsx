import { useState } from "react"
import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { PagedResponse, RecallSummaryResponse } from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState, EmptyState, LoadingOverlay } from "@/components/common"
import { Pagination } from "@/components/ui/pagination"
import { ArrowUpRight, FileQuestion, History } from "lucide-react"

export function StudentRecallsPage() {
  const [page, setPage] = useState(0)

  const { data, loading, refreshing, error, reload } = useApi(
    () => api.get<PagedResponse<RecallSummaryResponse>>("/student/recalls", {
      params: { page, size: 12 },
    }).then((r) => r.data),
    [page],
  )
  const papers = data?.content ?? []

  return (
    <>
      <PageHeader
        title="Recalls"
        description="Past-question papers. Open one to read its questions, answers and explanations — no timing, no scoring."
      />

      {loading ? <CenteredSpinner /> : error ? <ErrorState message={error} onRetry={reload} /> : papers.length === 0 ? (
        <EmptyState title="No recalls found" description="Check back soon — more are added regularly." />
      ) : (
        <LoadingOverlay active={refreshing}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {papers.map((m) => (
            <Link
              key={m.id}
              to={`${m.id}`}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_14px_36px_-12px_rgba(12,42,46,0.28)]"
            >
              {/* Gradient top accent on hover */}
              <span className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary via-primary/60 to-warning opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-warning/20 to-warning/5 text-warning ring-1 ring-warning/15">
                  <History className="size-[17px]" />
                </span>
                {m.examYear && (
                  <span className="tabular font-700 rounded-md bg-warning/10 px-2 py-0.5 text-[11px] text-warning">{m.examYear}</span>
                )}
              </div>

              <h3 className="font-800 mt-3 line-clamp-2 leading-snug tracking-tight transition-colors group-hover:text-primary">
                {m.title}
              </h3>

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
        </LoadingOverlay>
      )}
      {data && <Pagination page={page} totalPages={data.totalPages} onPage={setPage} />}
    </>
  )
}
