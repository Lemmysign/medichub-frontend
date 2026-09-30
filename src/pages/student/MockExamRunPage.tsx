import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type {
  AttemptDetailResponse,
  AttemptResponse,
  CheckAnswerResponse,
  MockExamStartResponse,
  MockExamSummaryResponse,
  PagedResponse,
  StudentQuestionResponse,
} from "@/lib/types"
import { CenteredSpinner, ErrorState } from "@/components/common"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, Clock, Flag, Lightbulb,
  Loader2, PauseCircle, Send, Target, Trophy, XCircle, AlertCircle,
} from "lucide-react"

type Phase = "intro" | "running" | "result"

interface Reveal {
  correctOptionIds: number[]
  selectedOptionIds: number[]
  correct: boolean
  explanation: string | null
}

function fmt(secs: number) {
  const s = Math.max(0, secs)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  const pad = (n: number) => n.toString().padStart(2, "0")
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(ss)}` : `${pad(m)}:${pad(ss)}`
}

function durationBetween(a: string, b: string) {
  const secs = Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 1000))
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const LETTERS = "ABCDEFGHIJ"

const typeLabel: Record<string, string> = {
  SINGLE_CHOICE: "Single best answer",
  MULTIPLE_CHOICE: "Multiple choice",
  TRUE_FALSE: "True / False",
}

/** Compact page window: 1 … current-1 current current+1 … last */
function pageWindow(current: number, total: number): (number | "…")[] {
  const pages = new Set<number>([1, total, current, current - 1, current + 1, current - 2, current + 2])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const out: (number | "…")[] = []
  let prev = 0
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push("…")
    out.push(p)
    prev = p
  }
  return out
}

/** Full-screen Mock Exam runner (timed/graded, taken at {@code basePath="student/mock-exams"}). */
export function MockExamRunPage({
  basePath = "student/mock-exams",
  backTo = "/student/mock-exams",
  backLabel = "Mock Exam",
  eyebrow = "Mock examination",
}: {
  basePath?: string
  backTo?: string
  backLabel?: string
  eyebrow?: string
}) {
  const { id } = useParams()
  const mockId = Number(id)

  const list = useApi(
    () => api.get<PagedResponse<MockExamSummaryResponse>>(`/${basePath}`, { params: { size: 100 } }).then((r) => r.data),
    [],
  )
  const attempts = useApi(
    () => api.get<PagedResponse<AttemptResponse>>(`/${basePath}/${mockId}/attempts`, { params: { size: 20 } }).then((r) => r.data),
    [mockId],
  )

  const [phase, setPhase] = useState<Phase>("intro")
  const [exam, setExam] = useState<MockExamStartResponse | null>(null)
  const [answers, setAnswers] = useState<Record<number, number[]>>({})
  const [checks, setChecks] = useState<Record<number, CheckAnswerResponse>>({})
  const [flags, setFlags] = useState<Set<number>>(new Set())
  const [current, setCurrent] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [paused, setPaused] = useState(false)
  const [resuming, setResuming] = useState(false)
  const [result, setResult] = useState<AttemptDetailResponse | null>(null)
  const [starting, setStarting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const submittedRef = useRef(false)

  const immediate = exam?.feedbackMode === "IMMEDIATE"
  const timed = !!exam?.durationMinutes

  useEffect(() => {
    if (phase !== "running" || !exam || !exam.expiresAt || paused) return
    const deadline = new Date(exam.expiresAt).getTime()
    const tick = () => {
      const secs = Math.round((deadline - Date.now()) / 1000)
      setRemaining(secs)
      if (secs <= 0) { clearInterval(timer); void submit(true) }
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, exam, paused])

  async function start() {
    setStarting(true)
    try {
      const res = await api.post<MockExamStartResponse>(`/${basePath}/${mockId}/start`)
      submittedRef.current = false
      setExam(res.data)
      setAnswers({}); setChecks({}); setFlags(new Set()); setCurrent(0)
      setPaused(false); setResult(null); setPhase("running")
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setStarting(false)
    }
  }

  function toggle(q: StudentQuestionResponse, optionId: number) {
    if (!exam || phase !== "running" || checks[q.id] || paused) return
    const multi = q.type === "MULTIPLE_CHOICE"
    setAnswers((prev) => {
      const cur = prev[q.id] ?? []
      if (multi) {
        const next = cur.includes(optionId) ? cur.filter((x) => x !== optionId) : [...cur, optionId]
        return { ...prev, [q.id]: next }
      }
      return { ...prev, [q.id]: [optionId] }
    })
    // Single-answer questions reveal immediately on pick; multiple-choice waits for the Check button.
    if (immediate && !multi) void checkQuestion(q, [optionId])
  }

  async function checkQuestion(q: StudentQuestionResponse, ids: number[]) {
    if (!exam || ids.length === 0) return
    try {
      const res = await api.post<CheckAnswerResponse>(
        `/${basePath}/${mockId}/attempts/${exam.attemptId}/questions/${q.id}/check`,
        { selectedOptionIds: ids },
      )
      setChecks((prev) => ({ ...prev, [q.id]: res.data }))
      if (res.data.timerPaused) setPaused(true)
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  async function resume() {
    if (!exam) return
    setResuming(true)
    try {
      const res = await api.post<MockExamStartResponse>(`/${basePath}/${mockId}/attempts/${exam.attemptId}/resume`)
      setExam((prev) => (prev ? { ...prev, expiresAt: res.data.expiresAt } : res.data))
      setPaused(false)
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setResuming(false)
    }
  }

  async function submit(auto = false) {
    if (!exam || submittedRef.current) return
    submittedRef.current = true
    setConfirmOpen(false)
    try {
      const payload = {
        answers: Object.entries(answers)
          .filter(([, ids]) => ids.length > 0)
          .map(([q, ids]) => ({ questionId: Number(q), selectedOptionIds: ids })),
      }
      const res = await api.post<AttemptDetailResponse>(`/${basePath}/${mockId}/attempts/${exam.attemptId}/submit`, payload)
      setResult(res.data); setPaused(false); setPhase("result")
      attempts.reload(); list.reload()
      if (auto) toast.message("Time's up — your exam was submitted automatically.")
      window.scrollTo(0, 0)
    } catch (e) {
      toast.error(errorMessage(e)); submittedRef.current = false
    }
  }

  function toggleFlag(qid: number) {
    setFlags((prev) => {
      const next = new Set(prev)
      next.has(qid) ? next.delete(qid) : next.add(qid)
      return next
    })
  }

  const summary = list.data?.content.find((m) => m.id === mockId)
  const total = exam?.questions.length ?? 0
  const answeredCount = Object.values(answers).filter((a) => a.length > 0).length

  const resultByQuestion = useMemo(
    () => new Map(result?.answers.map((a) => [a.questionId, a])),
    [result],
  )
  function revealFor(qid: number): Reveal | null {
    const r = resultByQuestion.get(qid)
    if (r) return { correctOptionIds: r.correctOptionIds ?? [], selectedOptionIds: r.selectedOptionIds ?? [], correct: r.correct, explanation: r.explanation }
    const c = checks[qid]
    if (c) return { correctOptionIds: c.correctOptionIds ?? [], selectedOptionIds: answers[qid] ?? [], correct: c.correct, explanation: c.explanation }
    return null
  }

  // ---------------------------------------------------------------- INTRO
  if (phase === "intro") {
    const introTimed = summary ? summary.durationMinutes != null : true
    const history = attempts.data?.content ?? []
    return (
      <div className="mx-auto max-w-2xl">
        <Link to={backTo} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to {backLabel}
        </Link>

        <Card className="overflow-hidden p-0">
          <div className="bg-primary p-6 text-primary-foreground">
            <div className="mb-3 flex size-11 items-center justify-center rounded-md bg-white/15">
              <ClipboardList className="size-5" />
            </div>
            <div className="font-700 text-[10px] uppercase tracking-widest opacity-80">
              {eyebrow}{summary?.subjectName ? ` · ${summary.subjectName}` : ""}{summary?.examYear ? ` · ${summary.examYear}` : ""}
            </div>
            <h1 className="font-800 text-2xl tracking-tight">{summary?.title ?? "Exam"}</h1>
            {summary?.description && <p className="mt-2 text-sm opacity-90">{summary.description}</p>}
          </div>

          <div className="grid grid-cols-2 divide-x divide-y divide-border border-b border-border [&>div]:p-5">
            <Stat icon={<ClipboardList className="size-4" />} value={summary?.questionCount ?? "—"} label="Questions" />
            <Stat icon={<Clock className="size-4" />} value={introTimed ? `${summary?.durationMinutes} min` : "Untimed"} label="Duration" />
            <Stat icon={<Target className="size-4" />} value={`${summary?.passMarkPercent ?? "—"}%`} label="Pass mark" />
            <Stat icon={<Trophy className="size-4" />} value={summary?.bestScorePercent != null ? `${summary.bestScorePercent}%` : "—"} label="Your best" />
          </div>

          {history.length > 0 && (
            <div className="border-b border-border p-5">
              <div className="font-700 mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">Attempt history</div>
              <div className="space-y-2">
                {history.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 text-sm">
                    <span className={"size-2 shrink-0 rounded-full " + (a.passed ? "bg-success" : "bg-destructive")} />
                    <span className="flex-1 text-muted-foreground">{new Date(a.submittedAt).toLocaleDateString()}</span>
                    <span className="tabular text-muted-foreground">{durationBetween(a.startedAt, a.submittedAt)}</span>
                    <span className={"tabular font-700 w-12 text-right " + (a.passed ? "text-success" : "text-destructive")}>{a.scorePercent}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-5">
            <div className="mb-4 flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 p-3 text-xs text-muted-foreground">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" />
              {introTimed
                ? <span>The timer starts immediately when you begin. The exam will <span className="font-700">auto-submit</span> when time runs out. Ensure you have a stable internet connection.</span>
                : <span>This exam is self-paced. Submit when you're ready.</span>}
            </div>
            <Button className="font-700 w-full" size="lg" onClick={start} disabled={starting}>
              {starting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <span className="mr-2">▷</span>}
              Begin Exam
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (!exam) return <CenteredSpinner />
  if (list.error) return <ErrorState message={list.error} />

  // ---------------------------------------------------------------- RESULT
  if (phase === "result" && result) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className={"mb-6 p-6 " + (result.passed ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5")}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {result.passed ? <CheckCircle2 className="size-8 text-success" /> : <XCircle className="size-8 text-destructive" />}
              <div>
                <p className="tabular font-800 text-3xl">{result.scorePercent}%</p>
                <p className="text-sm text-muted-foreground">{result.passed ? "Passed" : "Not passed"} · pass mark {exam.passMarkPercent}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setPhase("intro")}>Done</Button>
              <Button onClick={start}>Retake</Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          {exam.questions.map((q, i) => {
            const reveal = revealFor(q.id)
            return (
              <Card key={q.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-600"><span className="text-muted-foreground">{i + 1}.</span> {q.text}</p>
                  {reveal && <Badge variant={reveal.correct ? "default" : "destructive"}>{reveal.correct ? "Correct" : "Wrong"}</Badge>}
                </div>
                {q.imageUrl && <img src={q.imageUrl} alt="" className="mt-3 max-h-72 rounded-lg border border-border object-contain" />}
                <div className="mt-3 space-y-2">
                  {q.options.map((o, oi) => {
                    const isCorrect = reveal && reveal.correctOptionIds.includes(o.id)
                    const isWrongPick = reveal && reveal.selectedOptionIds.includes(o.id) && !reveal.correctOptionIds.includes(o.id)
                    let cls = "border-border"
                    if (isCorrect) cls = "border-success bg-success/10"
                    else if (isWrongPick) cls = "border-destructive bg-destructive/10"
                    return (
                      <div key={o.id} className={"flex items-center gap-3 rounded-md border p-3 text-sm " + cls}>
                        <span className="font-700 w-5 shrink-0 text-muted-foreground">{LETTERS[oi]}</span>
                        <span className="flex-1">{o.text}</span>
                        {isCorrect && <CheckCircle2 className="size-4 text-success" />}
                        {isWrongPick && <XCircle className="size-4 text-destructive" />}
                      </div>
                    )
                  })}
                </div>
                {reveal?.explanation && (
                  <div className="mt-3 flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
                    <p><span className="font-600">Explanation: </span>{reveal.explanation}</p>
                  </div>
                )}
              </Card>
            )
          })}
        </div>

      </div>
    )
  }

  // ---------------------------------------------------------------- RUNNING (full-screen focus)
  const q = exam.questions[current]
  const reveal = revealFor(q.id)
  const locked = !!checks[q.id] || paused
  const isMulti = q.type === "MULTIPLE_CHOICE"
  const picked = answers[q.id] ?? []

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top bar */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-3">
        <div className="flex-1 truncate text-sm">
          <span className="font-700">{exam.title}</span>
          <span className="text-muted-foreground"> · {answeredCount}/{total} answered</span>
        </div>
        {timed && (
          <Badge variant={paused ? "secondary" : remaining <= 60 ? "destructive" : "secondary"} className="tabular gap-1 px-3 py-1.5 text-base">
            {paused ? <PauseCircle className="size-4" /> : <Clock className="size-4" />} {fmt(remaining)}
          </Badge>
        )}
        <Button size="sm" onClick={() => setConfirmOpen(true)} disabled={paused}>
          <Send className="mr-1 size-4" /> Submit
        </Button>
      </header>
      <div className="h-1 shrink-0 bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${total ? (answeredCount / total) * 100 : 0}%` }} />
      </div>

      {/* Question */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              QUESTION <span className="font-800 text-2xl text-foreground">{current + 1}</span> / {total}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-700 rounded-full bg-muted px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                {typeLabel[q.type] ?? "Question"}
              </span>
              <button
                onClick={() => toggleFlag(q.id)}
                className={"font-700 flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] uppercase tracking-widest transition-colors " +
                  (flags.has(q.id) ? "border-warning bg-warning/10 text-warning" : "border-border text-muted-foreground hover:bg-muted")}
              >
                <Flag className="size-3" /> Flag
              </button>
            </div>
          </div>

          <Card className="mb-4 p-6">
            <p className="leading-relaxed">{q.text}</p>
            {q.imageUrl && <img src={q.imageUrl} alt="" className="mt-4 max-h-80 rounded-lg border border-border object-contain" />}
          </Card>

          {isMulti && !locked && (
            <p className="mb-2 text-xs font-600 text-muted-foreground">Select all that apply.</p>
          )}
          <div className="space-y-3">
            {q.options.map((o, oi) => {
              const selected = picked.includes(o.id)
              const isCorrect = reveal && reveal.correctOptionIds.includes(o.id)
              const isWrongPick = reveal && reveal.selectedOptionIds.includes(o.id) && !reveal.correctOptionIds.includes(o.id)
              let cls = "border-border bg-card hover:bg-muted"
              if (isCorrect) cls = "border-success bg-success/10"
              else if (isWrongPick) cls = "border-destructive bg-destructive/10"
              else if (selected) cls = "border-primary bg-primary/5"
              return (
                <label key={o.id} className={"flex items-center gap-3 rounded-lg border p-4 text-sm transition-colors " + (locked ? "cursor-default " : "cursor-pointer ") + cls}>
                  <span className="font-700 w-4 shrink-0 text-muted-foreground">{LETTERS[oi]}</span>
                  <input
                    type={isMulti ? "checkbox" : "radio"}
                    name={`q-${q.id}`}
                    checked={selected}
                    disabled={locked}
                    onChange={() => toggle(q, o.id)}
                    className={"size-4 shrink-0 accent-primary " + (isMulti ? "rounded" : "")}
                  />
                  <span className="flex-1">{o.text}</span>
                  {isCorrect && <CheckCircle2 className="size-4 text-success" />}
                  {isWrongPick && <XCircle className="size-4 text-destructive" />}
                </label>
              )
            })}
          </div>

          {/* Multiple-choice needs an explicit check in study mode (single-answer reveals on pick). */}
          {immediate && isMulti && !locked && (
            <Button className="mt-3" size="sm" disabled={picked.length === 0} onClick={() => checkQuestion(q, picked)}>
              Check answer
            </Button>
          )}

          {/* Immediate-mode reveal — shown once answered, whether right or wrong */}
          {immediate && reveal && reveal.explanation && (
            <div className="mt-4 flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <p><span className="font-600">Explanation: </span>{reveal.explanation}</p>
            </div>
          )}
          {paused && (
            <div className="mt-4 flex items-center justify-between gap-4 rounded-md border border-amber-500/40 bg-amber-500/5 p-3">
              <p className="flex items-center gap-2 text-sm"><PauseCircle className="size-4 text-amber-500" /> Timer paused — review, then continue.</p>
              <Button size="sm" onClick={resume} disabled={resuming}>
                {resuming && <Loader2 className="mr-2 size-4 animate-spin" />} Continue
              </Button>
            </div>
          )}

          {/* Footer nav */}
          <div className="mt-8 flex items-center justify-between gap-4">
            <Button variant="outline" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}>
              <ArrowLeft className="mr-1 size-4" /> Previous
            </Button>
            <div className="hidden items-center gap-1 sm:flex">
              {pageWindow(current + 1, total).map((p, i) =>
                p === "…" ? (
                  <span key={`e${i}`} className="px-1 text-muted-foreground">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrent(p - 1)}
                    className={"tabular size-8 rounded-md text-xs font-600 transition-colors " +
                      (p === current + 1
                        ? "bg-primary text-primary-foreground"
                        : (answers[exam.questions[p - 1].id]?.length ?? 0) > 0
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : flags.has(exam.questions[p - 1].id)
                        ? "bg-warning/15 text-warning"
                        : "text-muted-foreground hover:bg-muted")}
                  >
                    {p}
                  </button>
                ),
              )}
            </div>
            <Button onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))} disabled={current >= total - 1 || paused}>
              Next <ArrowRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Submit confirmation */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
              <AlertCircle className="size-5" />
            </div>
            <div>
              <h2 className="font-700 text-lg">Submit exam?</h2>
              <p className="mt-1 text-sm">You have answered <span className="font-700">{answeredCount}</span> of {total} questions.</p>
              <p className="mt-1 text-sm text-muted-foreground">Unanswered questions will be marked as incorrect. This action cannot be undone.</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Continue exam</Button>
            <Button onClick={() => submit(false)}>Submit now</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div>
      <div className="mb-1 text-muted-foreground">{icon}</div>
      <div className="tabular font-800 text-xl">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
