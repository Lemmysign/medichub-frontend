import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { MockExamResponse, QuestionResponse } from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState } from "@/components/common"
import { QuestionEditor, type QuestionPayload } from "@/components/QuestionEditor"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2 } from "lucide-react"

export function MockExamManagePage() {
  const { id } = useParams()
  const mock = useApi(() => api.get<MockExamResponse>(`/mock-exams/${id}`).then((r) => r.data), [id])
  const questions = useApi(() => api.get<QuestionResponse[]>(`/mock-exams/${id}/questions`).then((r) => r.data), [id])

  async function addQuestion(payload: QuestionPayload) {
    await api.post(`/mock-exams/${id}/questions`, payload)
    toast.success("Question added")
    questions.reload()
    mock.reload()
  }
  async function removeQuestion(qid: number) {
    if (!confirm("Delete this question?")) return
    try { await api.delete(`/mock-exams/${id}/questions/${qid}`); questions.reload(); mock.reload() }
    catch (e) { toast.error(errorMessage(e)) }
  }

  if (mock.loading) return <CenteredSpinner />
  if (mock.error) return <ErrorState message={mock.error} />
  const m = mock.data!

  return (
    <>
      <PageHeader
        title={m.title}
        description={`${m.durationMinutes} min · pass ${m.passMarkPercent}% · ${m.published ? "published" : "draft"}`}
        action={<Button asChild variant="outline"><Link to="..">Back</Link></Button>}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <h3 className="mb-2 font-medium">Questions ({m.questionCount})</h3>
          {questions.loading ? <CenteredSpinner /> : (
            <Card className="divide-y p-0">
              {(questions.data ?? []).map((q, i) => (
                <div key={q.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{i + 1}. {q.text}</p>
                    <Button size="sm" variant="ghost" onClick={() => removeQuestion(q.id)}><Trash2 className="size-4 text-destructive" /></Button>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {q.options.map((o) => (
                      <Badge key={o.id} variant={o.correct ? "default" : "secondary"}>{o.text}</Badge>
                    ))}
                  </div>
                </div>
              ))}
              {(questions.data ?? []).length === 0 && <div className="px-4 py-6 text-sm text-muted-foreground">No questions yet.</div>}
            </Card>
          )}
        </div>
        <div>
          <h3 className="mb-2 font-medium">Add a question</h3>
          <QuestionEditor onSave={addQuestion} />
        </div>
      </div>
    </>
  )
}
