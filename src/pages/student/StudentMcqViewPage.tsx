import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { api } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { McqQuestionResponse, PagedResponse } from "@/lib/types"
import { CenteredSpinner, ErrorState, EmptyState } from "@/components/common"
import { Pagination } from "@/components/ui/pagination"
import { Card } from "@/components/ui/card"
import { ArrowLeft, CheckCircle2, Lightbulb, ListChecks } from "lucide-react"

const LETTERS = "ABCDEFGHIJ"
const PAGE_SIZE = 15

export function StudentMcqViewPage() {
  const { id } = useParams()
  const [page, setPage] = useState(0)
  const { data, loading, error } = useApi(
    () => api.get<PagedResponse<McqQuestionResponse>>(`/student/mcqs/${id}/questions`, {
      params: { page, size: PAGE_SIZE },
    }).then((r) => r.data),
    [id, page],
  )
  const questions = data?.content ?? []
  const first = questions[0]
  const title = first?.sourceTitle ?? "MCQs"

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/student/mcqs" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to MCQs
      </Link>

      {/* Paper header */}
      <Card className="mb-6 p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ListChecks className="size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-800 text-xl tracking-tight">{title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {data && <span className="text-xs text-muted-foreground">{data.totalElements} question{data.totalElements === 1 ? "" : "s"}</span>}
            </div>
          </div>
        </div>
      </Card>

      {loading ? <CenteredSpinner /> : error ? <ErrorState message={error} /> : questions.length === 0 ? (
        <EmptyState title="No questions in this set yet" />
      ) : (
        <>
          <div className="space-y-4">
            {questions.map((q, i) => {
              const number = page * PAGE_SIZE + i + 1
              return (
                <Card key={q.id} className="p-5">
                  <p className="font-600"><span className="text-muted-foreground">{number}.</span> {q.text}</p>
                  {q.imageUrl && <img src={q.imageUrl} alt="" className="mt-3 max-h-72 rounded-lg border border-border object-contain" />}

                  <div className="mt-3 space-y-2">
                    {q.options.map((o, oi) => {
                      const correct = o.correct
                      return (
                        <div
                          key={o.id}
                          className={"flex items-center gap-3 rounded-md border p-3 text-sm " +
                            (correct ? "border-success bg-success/10" : "border-border")}
                        >
                          <span className={"font-700 w-5 shrink-0 " + (correct ? "text-success" : "text-muted-foreground")}>{LETTERS[oi]}</span>
                          <span className={"flex-1 " + (correct ? "font-600" : "")}>{o.text}</span>
                          {correct && <CheckCircle2 className="size-4 shrink-0 text-success" />}
                        </div>
                      )
                    })}
                  </div>

                  {q.explanation && (
                    <div className="mt-3 flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
                      <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
                      <p><span className="font-600">Explanation: </span>{q.explanation}</p>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
          {data && <Pagination page={data.page} totalPages={data.totalPages} onPage={(p) => { setPage(p); window.scrollTo(0, 0) }} />}
        </>
      )}
    </div>
  )
}
