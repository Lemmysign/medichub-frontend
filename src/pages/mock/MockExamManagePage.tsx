import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import { useSubjects } from "@/hooks/useSubjects"
import { useConfirm } from "@/components/ConfirmDialogProvider"
import type { FeedbackMode, MockExamResponse, QuestionResponse, TestKind } from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState } from "@/components/common"
import { QuestionEditor, type QuestionPayload } from "@/components/QuestionEditor"
import { BulkImportDialog } from "@/components/BulkImportDialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Pagination } from "@/components/ui/pagination"
import { Loader2, Pencil, Trash2 } from "lucide-react"

const QUESTIONS_PER_PAGE = 15

/**
 * Creator-side management of a standalone exam and its questions. Reused for Mock Exams
 * ({@code basePath="mock-exams"}), Recalls ({@code basePath="recalls"}, {@code kind="RECALL"}),
 * and MCQs ({@code basePath="mcqs"}, {@code kind="MCQ_BANK"}). Recalls and MCQs are both
 * view-only (no exam settings); MCQs additionally have no year field.
 */
export function MockExamManagePage({ basePath = "mock-exams", kind = "MCQ" as TestKind }: { basePath?: string; kind?: TestKind }) {
  const { id } = useParams()
  const mock = useApi(() => api.get<MockExamResponse>(`/${basePath}/${id}`).then((r) => r.data), [id])
  const questions = useApi(() => api.get<QuestionResponse[]>(`/${basePath}/${id}/questions`).then((r) => r.data), [id])
  const [editingQid, setEditingQid] = useState<number | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [qPage, setQPage] = useState(0)
  const confirm = useConfirm()
  const isRecall = kind === "RECALL"
  const isMcqBank = kind === "MCQ_BANK"
  const isViewOnly = isRecall || isMcqBank
  const noun = isRecall ? "recall" : isMcqBank ? "MCQs paper" : "Mock Exam"

  async function addQuestion(payload: QuestionPayload) {
    await api.post(`/${basePath}/${id}/questions`, payload)
    toast.success("Question added")
    questions.reload()
    mock.reload()
  }
  async function updateQuestion(qid: number, payload: QuestionPayload) {
    await api.put(`/${basePath}/${id}/questions/${qid}`, payload)
    toast.success("Question updated")
    setEditingQid(null)
    questions.reload()
  }
  async function removeQuestion(qid: number) {
    if (!(await confirm("Delete this question? This cannot be undone."))) return
    try { await api.delete(`/${basePath}/${id}/questions/${qid}`); questions.reload(); mock.reload() }
    catch (e) { toast.error(errorMessage(e)) }
  }

  if (mock.loading) return <CenteredSpinner />
  if (mock.error) return <ErrorState message={mock.error} />
  const m = mock.data!

  const meta = (isViewOnly
    ? [
        m.subjectName,
        isRecall && m.examYear ? `${m.examYear}` : null,
        `${m.questionCount} questions`,
        m.published ? "published" : "draft",
      ]
    : [
        m.subjectName,
        m.durationMinutes ? `${m.durationMinutes} min` : "Untimed",
        `pass ${m.passMarkPercent}%`,
        m.feedbackMode === "IMMEDIATE" ? "study mode" : "exam mode",
        m.published ? "published" : "draft",
      ]
  ).filter(Boolean).join(" · ")

  return (
    <>
      <PageHeader
        title={m.title}
        description={meta}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil className="mr-1 size-4" /> Edit settings</Button>
            <Button asChild variant="outline"><Link to=".." relative="path">Back</Link></Button>
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <h3 className="mb-2 font-medium">Questions ({m.questionCount})</h3>
          {questions.loading ? <CenteredSpinner /> : (() => {
            const all = questions.data ?? []
            const totalQPages = Math.max(1, Math.ceil(all.length / QUESTIONS_PER_PAGE))
            const cur = Math.min(qPage, totalQPages - 1)
            const pageItems = all.slice(cur * QUESTIONS_PER_PAGE, cur * QUESTIONS_PER_PAGE + QUESTIONS_PER_PAGE)
            return (
              <>
                <Card className="divide-y p-0">
                  {pageItems.map((q, idx) => {
                    const number = cur * QUESTIONS_PER_PAGE + idx + 1
                    return editingQid === q.id ? (
                      <div key={q.id} className="p-4">
                        <QuestionEditor
                          initial={{ text: q.text, type: q.type, explanation: q.explanation, imageUrl: q.imageUrl, options: q.options.map((o) => ({ text: o.text, correct: o.correct })) }}
                          onSave={(p) => updateQuestion(q.id, p)}
                          onCancel={() => setEditingQid(null)}
                          submitLabel="Update question"
                        />
                      </div>
                    ) : (
                      <div key={q.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{number}. {q.text}</p>
                          <div className="flex shrink-0 gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setEditingQid(q.id)}><Pencil className="size-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => removeQuestion(q.id)}><Trash2 className="size-4 text-destructive" /></Button>
                          </div>
                        </div>
                        {q.imageUrl && <img src={q.imageUrl} alt="" className="mt-2 max-h-40 rounded-md border border-border object-contain" />}
                        <div className="mt-1 flex flex-wrap gap-2">
                          {q.options.map((o) => (
                            <Badge key={o.id} variant={o.correct ? "default" : "secondary"}>{o.text}</Badge>
                          ))}
                        </div>
                        {q.explanation && <p className="mt-2 text-xs text-muted-foreground"><span className="font-medium">Explanation:</span> {q.explanation}</p>}
                      </div>
                    )
                  })}
                  {all.length === 0 && <div className="px-4 py-6 text-sm text-muted-foreground">No questions yet.</div>}
                </Card>
                {all.length > QUESTIONS_PER_PAGE && <Pagination page={cur} totalPages={totalQPages} onPage={setQPage} />}
              </>
            )
          })()}
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="font-medium">Add a question</h3>
            <BulkImportDialog endpoint={`/${basePath}/${id}/questions/bulk`} onImported={() => { questions.reload(); mock.reload() }} />
          </div>
          <QuestionEditor onSave={addQuestion} />
        </div>
      </div>

      {editOpen && (
        <EditSettingsDialog
          mock={m}
          basePath={basePath}
          isViewOnly={isViewOnly}
          hasYear={isRecall}
          noun={noun}
          onClose={() => setEditOpen(false)}
          onSaved={() => { setEditOpen(false); mock.reload() }}
        />
      )}
    </>
  )
}

function EditSettingsDialog({
  mock, basePath, isViewOnly, hasYear, noun, onClose, onSaved,
}: {
  mock: MockExamResponse
  basePath: string
  isViewOnly: boolean
  hasYear: boolean
  noun: string
  onClose: () => void
  onSaved: () => void
}) {
  const subjects = useSubjects()
  const [form, setForm] = useState({
    title: mock.title,
    description: mock.description ?? "",
    passMarkPercent: mock.passMarkPercent,
    timed: mock.durationMinutes != null,
    durationMinutes: mock.durationMinutes ?? 30,
    feedbackMode: mock.feedbackMode as FeedbackMode,
    subjectId: mock.subjectId ?? 0,
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const body: Record<string, unknown> = isViewOnly
        ? {
            title: form.title,
            description: form.description,
            subjectId: form.subjectId,
            // The year is no longer edited here; keep whatever an existing recall already has.
            ...(hasYear && mock.examYear != null ? { examYear: mock.examYear } : {}),
          }
        : {
            title: form.title,
            description: form.description,
            passMarkPercent: form.passMarkPercent,
            durationMinutes: form.timed ? form.durationMinutes : null,
            feedbackMode: form.feedbackMode,
            subjectId: form.subjectId,
          }
      await api.put(`/${basePath}/${mock.id}`, body)
      toast.success("Settings updated")
      onSaved()
    } catch (e) { toast.error(errorMessage(e)) } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit {noun} settings</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-2">
              <Label>Subject</Label>
              <select
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: Number(e.target.value) })}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
              >
                <option value={0} disabled>Select subject…</option>
                {(subjects.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>

          {!isViewOnly && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Pass mark %</Label><Input type="number" min={0} max={100} value={form.passMarkPercent} onChange={(e) => setForm({ ...form, passMarkPercent: Number(e.target.value) })} /></div>
                <div className="space-y-2">
                  <Label>Duration (min)</Label>
                  <Input type="number" min={1} disabled={!form.timed} value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.timed} onChange={(e) => setForm({ ...form, timed: e.target.checked })} className="size-4 accent-primary" />
                Timed exam (uncheck for a self-paced, untimed exam)
              </label>
              <div className="space-y-2">
                <Label>Feedback</Label>
                <select
                  value={form.feedbackMode}
                  onChange={(e) => setForm({ ...form, feedbackMode: e.target.value as FeedbackMode })}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                >
                  <option value="ON_SUBMISSION">Exam — reveal answers after submit</option>
                  <option value="IMMEDIATE">Study — reveal on each wrong answer</option>
                </select>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={saving || !form.title.trim() || !form.subjectId}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />} Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
