import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { api } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { PracticePaperResponse } from "@/lib/types"
import { CenteredSpinner, ErrorState, EmptyState } from "@/components/common"
import { Pagination } from "@/components/ui/pagination"
import { Card } from "@/components/ui/card"
import { ArrowLeft, CheckCircle2, Lightbulb, ListChecks, Tag, XCircle } from "lucide-react"

const LETTERS = "ABCDEFGHIJ"
const PAGE_SIZE = 10

export function StudentMcqPracticePage() {
  const { id } = useParams()
  const { data, loading, error } = useApi(
    () => api.get<PracticePaperResponse>(`/student/mock-exams/${id}/practice`).then((r) => r.data),
    [id],
  )
  const [page, setPage] = useState(0)
  // questionId -> the optionId the student picked (once picked, that question is revealed).
  const [picked, setPicked] = useState<Record<number, number>>({})

  if (loading) return <CenteredSpinner />
  if (error) return <ErrorState message={error} />
  const paper = data!
  const all = paper.questions
  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE))
  const cur = Math.min(page, totalPages - 1)
  const pageItems = all.slice(cur * PAGE_SIZE, cur * PAGE_SIZE + PAGE_SIZE)

  function pick(qid: number, oid: number) {
    setPicked((prev) => (prev[qid] != null ? prev : { ...prev, [qid]: oid }))
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/student/mcq" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to MCQ
      </Link>

      <Card className="mb-6 p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ListChecks className="size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-800 text-xl tracking-tight">{paper.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {paper.subjectName && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-600 text-accent-foreground">
                  <Tag className="size-3" /> {paper.subjectName}
                </span>
              )}
              <span className="text-xs text-muted-foreground">{all.length} question{all.length === 1 ? "" : "s"} · practice mode</span>
            </div>
          </div>
        </div>
      </Card>

      {all.length === 0 ? (
        <EmptyState title="No questions in this set yet" />
      ) : (
        <>
          <div className="space-y-4">
            {pageItems.map((q, i) => {
              const number = cur * PAGE_SIZE + i + 1
              const chosen = picked[q.id]
              const revealed = chosen != null
              return (
                <Card key={q.id} className="p-5">
                  <p className="font-600"><span className="text-muted-foreground">{number}.</span> {q.text}</p>
                  {q.imageUrl && <img src={q.imageUrl} alt="" className="mt-3 max-h-72 rounded-lg border border-border object-contain" />}

                  <div className="mt-3 space-y-2">
                    {q.options.map((o, oi) => {
                      const isChosen = chosen === o.id
                      const showCorrect = revealed && o.correct
                      const showWrong = revealed && isChosen && !o.correct
                      let cls = "border-border"
                      if (showCorrect) cls = "border-success bg-success/10"
                      else if (showWrong) cls = "border-destructive bg-destructive/10"
                      else if (!revealed) cls = "border-border hover:border-primary/50 hover:bg-muted cursor-pointer"
                      return (
                        <button
                          key={o.id}
                          type="button"
                          disabled={revealed}
                          onClick={() => pick(q.id, o.id)}
                          className={"flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm transition-colors " + cls + (revealed ? " cursor-default" : "")}
                        >
                          <span className={"font-700 w-5 shrink-0 " + (showCorrect ? "text-success" : showWrong ? "text-destructive" : "text-muted-foreground")}>{LETTERS[oi]}</span>
                          <span className={"flex-1 " + (showCorrect ? "font-600" : "")}>{o.text}</span>
                          {showCorrect && <CheckCircle2 className="size-4 shrink-0 text-success" />}
                          {showWrong && <XCircle className="size-4 shrink-0 text-destructive" />}
                        </button>
                      )
                    })}
                  </div>

                  {!revealed && <p className="mt-2 text-xs text-muted-foreground">Tap an option to check your answer.</p>}

                  {revealed && q.explanation && (
                    <div className="mt-3 flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
                      <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
                      <p><span className="font-600">Explanation: </span>{q.explanation}</p>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
          {all.length > PAGE_SIZE && <Pagination page={cur} totalPages={totalPages} onPage={(p) => { setPage(p); window.scrollTo(0, 0) }} />}
        </>
      )}
    </div>
  )
}
