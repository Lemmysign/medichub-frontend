import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { AttemptDetailResponse, AttemptResponse, PagedResponse, StudentTestResponse } from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState } from "@/components/common"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

export function TestTakePage() {
  const { courseId, testId } = useParams()
  const test = useApi(
    () => api.get<StudentTestResponse>(`/student/courses/${courseId}/tests/${testId}`).then((r) => r.data),
    [courseId, testId],
  )
  const attempts = useApi(
    () =>
      api
        .get<PagedResponse<AttemptResponse>>(`/student/courses/${courseId}/tests/${testId}/attempts`, { params: { size: 20 } })
        .then((r) => r.data),
    [courseId, testId],
  )

  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [result, setResult] = useState<AttemptDetailResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    setSubmitting(true)
    try {
      const payload = {
        answers: Object.entries(answers).map(([questionId, selectedOptionId]) => ({
          questionId: Number(questionId),
          selectedOptionId,
        })),
      }
      const res = await api.post<AttemptDetailResponse>(`/student/courses/${courseId}/tests/${testId}/submit`, payload)
      setResult(res.data)
      attempts.reload()
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  if (test.loading) return <CenteredSpinner />
  if (test.error) return <ErrorState message={test.error} />
  const t = test.data!
  const correctById = new Map(result?.answers.map((a) => [a.questionId, a.correct]))

  return (
    <>
      <PageHeader
        title={t.title}
        description={`${t.questions.length} questions • pass mark ${t.passMarkPercent}%`}
        action={<Button asChild variant="outline"><Link to={`/student/courses/${courseId}`}>Back to course</Link></Button>}
      />

      {result && (
        <Card className={"mb-6 p-6 " + (result.passed ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5")}>
          <div className="flex items-center gap-3">
            {result.passed ? <CheckCircle2 className="size-8 text-success" /> : <XCircle className="size-8 text-destructive" />}
            <div>
              <p className="text-2xl font-semibold">{result.scorePercent}%</p>
              <p className="text-sm text-muted-foreground">{result.passed ? "Passed" : "Not passed"} — pass mark {t.passMarkPercent}%</p>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {t.questions.map((q, i) => {
          const graded = correctById.has(q.id)
          const wasCorrect = correctById.get(q.id)
          return (
            <Card key={q.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">
                  <span className="text-muted-foreground">{i + 1}.</span> {q.text}
                </p>
                {graded && (
                  <Badge variant={wasCorrect ? "default" : "destructive"}>{wasCorrect ? "Correct" : "Wrong"}</Badge>
                )}
              </div>
              <div className="mt-3 space-y-2">
                {q.options.map((o) => (
                  <label
                    key={o.id}
                    className={
                      "flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition-colors " +
                      (answers[q.id] === o.id ? "border-primary bg-primary/5" : "hover:bg-muted")
                    }
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={answers[q.id] === o.id}
                      disabled={!!result}
                      onChange={() => setAnswers({ ...answers, [q.id]: o.id })}
                      className="size-4"
                    />
                    {o.text}
                  </label>
                ))}
              </div>
            </Card>
          )
        })}
      </div>

      {!result ? (
        <Button className="mt-6" onClick={submit} disabled={submitting}>
          {submitting && <Loader2 className="mr-2 size-4 animate-spin" />} Submit test
        </Button>
      ) : (
        <Button className="mt-6" variant="outline" onClick={() => { setResult(null); setAnswers({}) }}>
          Retake test
        </Button>
      )}

      {attempts.data && attempts.data.content.length > 0 && (
        <div className="mt-10">
          <h3 className="mb-3 font-medium">Past attempts</h3>
          <Card className="divide-y p-0">
            {attempts.data.content.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground">{new Date(a.submittedAt).toLocaleString()}</span>
                <span className="flex items-center gap-2">
                  {a.scorePercent}%
                  <Badge variant={a.passed ? "default" : "secondary"}>{a.passed ? "Passed" : "Failed"}</Badge>
                </span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </>
  )
}
