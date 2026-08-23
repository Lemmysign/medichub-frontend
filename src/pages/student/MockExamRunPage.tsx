import { useEffect, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type {
  AttemptDetailResponse,
  AttemptResponse,
  MockExamStartResponse,
  MockExamSummaryResponse,
  PagedResponse,
} from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState } from "@/components/common"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react"

type Phase = "intro" | "running" | "result"

function fmt(secs: number) {
  const m = Math.floor(Math.max(0, secs) / 60)
  const s = Math.max(0, secs) % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function MockExamRunPage() {
  const { id } = useParams()
  const mockId = Number(id)

  const list = useApi(
    () => api.get<PagedResponse<MockExamSummaryResponse>>("/student/mock-exams", { params: { size: 100 } }).then((r) => r.data),
    [],
  )
  const attempts = useApi(
    () => api.get<PagedResponse<AttemptResponse>>(`/student/mock-exams/${mockId}/attempts`, { params: { size: 20 } }).then((r) => r.data),
    [mockId],
  )

  const [phase, setPhase] = useState<Phase>("intro")
  const [exam, setExam] = useState<MockExamStartResponse | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [remaining, setRemaining] = useState(0)
  const [result, setResult] = useState<AttemptDetailResponse | null>(null)
  const [starting, setStarting] = useState(false)
  const submittedRef = useRef(false)

  // Countdown driven by the server-anchored expiresAt.
  useEffect(() => {
    if (phase !== "running" || !exam) return
    const deadline = new Date(exam.expiresAt).getTime()
    const tick = () => {
      const secs = Math.round((deadline - Date.now()) / 1000)
      setRemaining(secs)
      if (secs <= 0) {
        clearInterval(timer)
        void submit(true)
      }
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, exam])

  async function start() {
    setStarting(true)
    try {
      const res = await api.post<MockExamStartResponse>(`/student/mock-exams/${mockId}/start`)
      submittedRef.current = false
      setExam(res.data)
      setAnswers({})
      setResult(null)
      setPhase("running")
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setStarting(false)
    }
  }

  async function submit(auto = false) {
    if (!exam || submittedRef.current) return
    submittedRef.current = true
    try {
      const payload = {
        answers: Object.entries(answers).map(([q, o]) => ({ questionId: Number(q), selectedOptionId: o })),
      }
      const res = await api.post<AttemptDetailResponse>(
        `/student/mock-exams/${mockId}/attempts/${exam.attemptId}/submit`, payload)
      setResult(res.data)
      setPhase("result")
      attempts.reload()
      list.reload()
      if (auto) toast.message("Time's up — your exam was submitted automatically.")
    } catch (e) {
      toast.error(errorMessage(e))
      submittedRef.current = false
    }
  }

  const summary = list.data?.content.find((m) => m.id === mockId)

  // ---- INTRO ----
  if (phase === "intro") {
    return (
      <>
        <PageHeader
          title={summary?.title ?? "Mock Exam"}
          description={summary?.description ?? undefined}
          action={<Button asChild variant="outline"><Link to="/student/mock-exams">Back</Link></Button>}
        />
        <Card className="max-w-lg p-6">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1"><Clock className="size-4 text-primary" /> {summary?.durationMinutes ?? "—"} minutes</span>
            <span>{summary?.questionCount ?? "—"} questions</span>
            <span>pass mark {summary?.passMarkPercent ?? "—"}%</span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            The timer starts when you click begin and cannot be paused. When it reaches zero your answers are submitted automatically. Unlimited retakes.
          </p>
          <Button className="mt-5" onClick={start} disabled={starting}>
            {starting && <Loader2 className="mr-2 size-4 animate-spin" />} Begin exam
          </Button>
        </Card>

        {attempts.data && attempts.data.content.length > 0 && (
          <div className="mt-8 max-w-lg">
            <h3 className="mb-2 font-medium">Past attempts</h3>
            <Card className="divide-y p-0">
              {attempts.data.content.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-muted-foreground">{new Date(a.submittedAt).toLocaleString()}</span>
                  <span className="flex items-center gap-2">{a.scorePercent}% <Badge variant={a.passed ? "default" : "secondary"}>{a.passed ? "Passed" : "Failed"}</Badge></span>
                </div>
              ))}
            </Card>
          </div>
        )}
      </>
    )
  }

  if (!exam) return <CenteredSpinner />
  if (list.error) return <ErrorState message={list.error} />

  const correctById = new Map(result?.answers.map((a) => [a.questionId, a.correct]))

  // ---- RUNNING / RESULT ----
  return (
    <>
      <div className="sticky top-16 z-20 mb-4 flex items-center justify-between rounded-lg border bg-background/95 px-4 py-3 backdrop-blur">
        <h1 className="font-semibold">{exam.title}</h1>
        {phase === "running" ? (
          <Badge variant={remaining <= 30 ? "destructive" : "secondary"} className="gap-1 text-base">
            <Clock className="size-4" /> {fmt(remaining)}
          </Badge>
        ) : (
          <Badge variant={result?.passed ? "default" : "destructive"}>
            {result?.scorePercent}% · {result?.passed ? "Passed" : "Failed"}
          </Badge>
        )}
      </div>

      {phase === "result" && result && (
        <Card className={"mb-6 p-6 " + (result.passed ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5")}>
          <div className="flex items-center gap-3">
            {result.passed ? <CheckCircle2 className="size-8 text-success" /> : <XCircle className="size-8 text-destructive" />}
            <div>
              <p className="text-2xl font-semibold">{result.scorePercent}%</p>
              <p className="text-sm text-muted-foreground">{result.passed ? "Passed" : "Not passed"} · pass mark {exam.passMarkPercent}%</p>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {exam.questions.map((q, i) => {
          const graded = correctById.has(q.id)
          const wasCorrect = correctById.get(q.id)
          return (
            <Card key={q.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium"><span className="text-muted-foreground">{i + 1}.</span> {q.text}</p>
                {graded && <Badge variant={wasCorrect ? "default" : "destructive"}>{wasCorrect ? "Correct" : "Wrong"}</Badge>}
              </div>
              <div className="mt-3 space-y-2">
                {q.options.map((o) => (
                  <label
                    key={o.id}
                    className={"flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition-colors " +
                      (answers[q.id] === o.id ? "border-primary bg-primary/5" : "hover:bg-muted")}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={answers[q.id] === o.id}
                      disabled={phase === "result"}
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

      {phase === "running" ? (
        <Button className="mt-6" onClick={() => submit(false)}>Submit exam</Button>
      ) : (
        <div className="mt-6 flex gap-2">
          <Button variant="outline" onClick={() => setPhase("intro")}>Done</Button>
          <Button onClick={start}>Retake</Button>
        </div>
      )}
    </>
  )
}
