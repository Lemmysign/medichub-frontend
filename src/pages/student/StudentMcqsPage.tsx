import { useState } from "react"
import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { McqSummaryResponse, PagedResponse } from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState, EmptyState, LoadingOverlay } from "@/components/common"
import { Pagination } from "@/components/ui/pagination"
import { SubscriptionLocked } from "@/components/SubscriptionLocked"
import { ArrowUpRight, ListChecks } from "lucide-react"

/** Student-side MCQs — view-only question bank. Every set is listed; students see no subject filter or subject label. */
export function StudentMcqsPage() {
  const [page, setPage] = useState(0)

  const { data, loading, refreshing, error, errorStatus, reload } = useApi(
    () => api.get<PagedResponse<McqSummaryResponse>>("/student/mcqs", {
      params: { page, size: 12 },
    }).then((r) => r.data),
    [page],
  )
  const papers = data?.content ?? []

  return (
    <>
      <PageHeader
        title="MCQs"
        description="Question sets to study. Open one to read its questions, answers and explanations — no timing, no scoring."
      />

      {loading ? <CenteredSpinner /> : errorStatus === 402 ? <SubscriptionLocked feature="mcqs" /> : error ? <ErrorState message={error} onRetry={reload} /> : papers.length === 0 ? (
        <EmptyState title="No MCQs found" description="Check back soon — more are added regularly." />
      ) : (
        <LoadingOverlay active={refreshing}>
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

              <div className="mt-4 flex items-center justify-end border-t border-border/70 pt-3">
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
