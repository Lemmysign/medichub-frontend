import { useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type {
  AttemptDetailResponse,
  AttemptResponse,
  CheckAnswerResponse,
  PagedResponse,
  StudentQuestionResponse,
  StudentTestResponse,
} from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState } from "@/components/common"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Loader2, Lightbulb } from "lucide-react"
import { scrollAppToTop } from "@/lib/scroll"

/** Per-question reveal state: which option is correct, what the student picked, and the explanation. */
interface Reveal {
  correctOptionIds: number[]
  selectedOptionIds: number[]
  correct: boolean
  explanation: string | null
}

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

  const [answers, setAnswers] = useState<Record<number, number[]>>({})
  const [checks, setChecks] = useState<Record<number, CheckAnswerResponse>>({}) // immediate-mode reveals
  const [result, setResult] = useState<AttemptDetailResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // Questions being checked by the server right now: lock them and show a spinner until the answer comes back.
  const [checking, setChecking] = useState<Set<number>>(new Set())
  const checkingRef = useRef<Set<number>>(new Set())

  const immediate = test.data?.feedbackMode === "IMMEDIATE"

  function toggle(q: StudentQuestionResponse, optionId: number) {
    if (result || checks[q.id] || checkingRef.current.has(q.id)) return // locked once graded/revealed or while being checked
    const multi = q.type === "MULTIPLE_CHOICE"
    setAnswers((prev) => {
      const cur = prev[q.id] ?? []
      if (multi) {
        const next = cur.includes(optionId) ? cur.filter((x) => x !== optionId) : [...cur, optionId]
        return { ...prev, [q.id]: next }
      }
      return { ...prev, [q.id]: [optionId] }
    })
    // Single-answer questions reveal on pick; multiple-choice waits for the Check button.
    if (immediate && !multi) void checkQuestion(q, [optionId])
  }

  async function checkQuestion(q: StudentQuestionResponse, ids: number[]) {
    if (ids.length === 0 || checkingRef.current.has(q.id)) return
    checkingRef.current.add(q.id)
    setChecking(new Set(checkingRef.current))
    try {
      const res = await api.post<CheckAnswerResponse>(
        `/student/courses/${courseId}/tests/${testId}/questions/${q.id}/check`,
        { selectedOptionIds: ids },
      )
      setChecks((prev) => ({ ...prev, [q.id]: res.data }))
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      checkingRef.current.delete(q.id)
      setChecking(new Set(checkingRef.current))
    }
  }

  async function submit() {
    setSubmitting(true)
    try {
      const payload = {
        answers: Object.entries(answers)
          .filter(([, ids]) => ids.length > 0)
          .map(([questionId, ids]) => ({ questionId: Number(questionId), selectedOptionIds: ids })),
      }
      const res = await api.post<AttemptDetailResponse>(`/student/courses/${courseId}/tests/${testId}/submit`, payload)
      setResult(res.data)
      attempts.reload()
      scrollAppToTop(true)
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  function retake() {
    setResult(null)
    setAnswers({})
    setChecks({})
  }

  const answeredCount = Object.values(answers).filter((a) => a.length > 0).length

  if (test.loading) return <CenteredSpinner />
  if (test.error) return <ErrorState message={test.error} />
  const t = test.data!
  const resultByQuestion = new Map(result?.answers.map((a) => [a.questionId, a]))

  /** Resolve reveal info for a question from the post-submit result or the immediate check. */
  function revealFor(qid: number): Reveal | null {
    const r = resultByQuestion.get(qid)
    if (r) return { correctOptionIds: r.correctOptionIds ?? [], selectedOptionIds: r.selectedOptionIds ?? [], correct: r.correct, explanation: r.explanation }
    const c = checks[qid]
    if (c) return { correctOptionIds: c.correctOptionIds ?? [], selectedOptionIds: answers[qid] ?? [], correct: c.correct, explanation: c.explanation }
    return null
  }

  return (
    <>
      <PageHeader
        title={t.title}
        description={`${t.questions.length} questions • pass mark ${t.passMarkPercent}% • ${immediate ? "study mode" : "exam mode"}`}
        action={<Button asChild variant="outline"><Link to={`/student/courses/${courseId}`}>Back to course</Link></Button>}
      />

      {result && (
        <Card className={"mb-6 p-6 " + (result.passed ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5")}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {result.passed ? <CheckCircle2 className="size-8 text-success" /> : <XCircle className="size-8 text-destructive" />}
              <div>
                <p className="text-2xl font-semibold">{result.scorePercent}%</p>
                <p className="text-sm text-muted-foreground">{result.passed ? "Passed" : "Not passed"} — pass mark {t.passMarkPercent}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline"><Link to={`/student/courses/${courseId}`}>Done</Link></Button>
              <Button onClick={retake}>Retake test</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {t.questions.map((q, i) => {
          const reveal = revealFor(q.id)
          const isChecking = checking.has(q.id)
          const locked = !!result || !!checks[q.id] || isChecking
          const isMulti = q.type === "MULTIPLE_CHOICE"
          const picked = answers[q.id] ?? []
          return (
            <Card key={q.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">
                  <span className="text-muted-foreground">{i + 1}.</span> {q.text}
                  {isMulti && <span className="ml-2 text-xs font-normal text-muted-foreground">(select all that apply)</span>}
                </p>
                {reveal && (
                  <Badge variant={reveal.correct ? "default" : "destructive"}>{reveal.correct ? "Correct" : "Wrong"}</Badge>
                )}
              </div>
              <div className="mt-3 space-y-2">
                {q.options.map((o) => {
                  const selected = picked.includes(o.id)
                  const isCorrect = reveal && reveal.correctOptionIds.includes(o.id)
                  const isWrongPick = reveal && reveal.selectedOptionIds.includes(o.id) && !reveal.correctOptionIds.includes(o.id)
                  let cls = "hover:bg-muted"
                  if (isCorrect) cls = "border-success bg-success/10"
                  else if (isWrongPick) cls = "border-destructive bg-destructive/10"
                  else if (selected) cls = "border-primary bg-primary/5"
                  return (
                    <label
                      key={o.id}
                      className={"flex items-center gap-3 rounded-md border p-3 text-sm transition-colors " + (locked ? "cursor-default " : "cursor-pointer ") + cls}
                    >
                      <input
                        type={isMulti ? "checkbox" : "radio"}
                        name={`q-${q.id}`}
                        checked={selected}
                        disabled={locked}
                        onChange={() => toggle(q, o.id)}
                        className={"size-4 accent-primary " + (isMulti ? "rounded" : "")}
                      />
                      <span className="flex-1">{o.text}</span>
                      {isCorrect && <CheckCircle2 className="size-4 text-success" />}
                      {isWrongPick && <XCircle className="size-4 text-destructive" />}
                    </label>
                  )
                })}
              </div>
              {immediate && isMulti && !locked && (
                <Button className="mt-3" size="sm" variant="outline" disabled={picked.length === 0} onClick={() => checkQuestion(q, picked)}>
                  Check answer
                </Button>
              )}
              {isChecking && (
                <p role="status" className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-primary" /> Checking your answer…
                </p>
              )}
              {/* Explanation shows once a question is answered (study mode) or after submit — right or wrong. */}
              {reveal && reveal.explanation && (
                <div className="mt-3 flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
                  <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
                  <p><span className="font-medium">Explanation: </span>{reveal.explanation}</p>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {!result && (
        <Button className="mt-6" onClick={submit} disabled={submitting || answeredCount === 0}>
          {submitting && <Loader2 className="mr-2 size-4 animate-spin" />} Submit test
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
