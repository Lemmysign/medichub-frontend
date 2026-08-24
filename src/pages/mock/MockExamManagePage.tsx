import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { FeedbackMode, MockExamResponse, QuestionResponse } from "@/lib/types"
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
import { Loader2, Pencil, Trash2 } from "lucide-react"

export function MockExamManagePage() {
  const { id } = useParams()
  const mock = useApi(() => api.get<MockExamResponse>(`/mock-exams/${id}`).then((r) => r.data), [id])
  const questions = useApi(() => api.get<QuestionResponse[]>(`/mock-exams/${id}/questions`).then((r) => r.data), [id])
  const [editingQid, setEditingQid] = useState<number | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  async function addQuestion(payload: QuestionPayload) {
    await api.post(`/mock-exams/${id}/questions`, payload)
    toast.success("Question added")
    questions.reload()
    mock.reload()
  }
  async function updateQuestion(qid: number, payload: QuestionPayload) {
    await api.put(`/mock-exams/${id}/questions/${qid}`, payload)
    toast.success("Question updated")
    setEditingQid(null)
    questions.reload()
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
        description={`${m.durationMinutes ? `${m.durationMinutes} min` : "Untimed"} · pass ${m.passMarkPercent}% · ${m.feedbackMode === "IMMEDIATE" ? "study mode" : "exam mode"} · ${m.published ? "published" : "draft"}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil className="mr-1 size-4" /> Edit settings</Button>
            <Button asChild variant="outline"><Link to="..">Back</Link></Button>
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <h3 className="mb-2 font-medium">Questions ({m.questionCount})</h3>
          {questions.loading ? <CenteredSpinner /> : (
            <Card className="divide-y p-0">
              {(questions.data ?? []).map((q, i) =>
                editingQid === q.id ? (
                  <div key={q.id} className="p-4">
                    <QuestionEditor
                      initial={{ text: q.text, type: q.type, explanation: q.explanation, options: q.options.map((o) => ({ text: o.text, correct: o.correct })) }}
                      onSave={(p) => updateQuestion(q.id, p)}
                      onCancel={() => setEditingQid(null)}
                      submitLabel="Update question"
                    />
                  </div>
                ) : (
                  <div key={q.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{i + 1}. {q.text}</p>
                      <div className="flex shrink-0 gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditingQid(q.id)}><Pencil className="size-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => removeQuestion(q.id)}><Trash2 className="size-4 text-destructive" /></Button>
                      </div>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {q.options.map((o) => (
                        <Badge key={o.id} variant={o.correct ? "default" : "secondary"}>{o.text}</Badge>
                      ))}
                    </div>
                    {q.explanation && <p className="mt-2 text-xs text-muted-foreground"><span className="font-medium">Explanation:</span> {q.explanation}</p>}
                  </div>
                ),
              )}
              {(questions.data ?? []).length === 0 && <div className="px-4 py-6 text-sm text-muted-foreground">No questions yet.</div>}
            </Card>
          )}
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="font-medium">Add a question</h3>
            <BulkImportDialog endpoint={`/mock-exams/${id}/questions/bulk`} onImported={() => { questions.reload(); mock.reload() }} />
          </div>
          <QuestionEditor onSave={addQuestion} />
        </div>
      </div>

      {editOpen && <EditSettingsDialog mock={m} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); mock.reload() }} />}
    </>
  )
}

function EditSettingsDialog({ mock, onClose, onSaved }: { mock: MockExamResponse; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: mock.title,
    description: mock.description ?? "",
    passMarkPercent: mock.passMarkPercent,
    timed: mock.durationMinutes != null,
    durationMinutes: mock.durationMinutes ?? 30,
    feedbackMode: mock.feedbackMode as FeedbackMode,
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      await api.put(`/mock-exams/${mock.id}`, {
        title: form.title,
        description: form.description,
        passMarkPercent: form.passMarkPercent,
        durationMinutes: form.timed ? form.durationMinutes : null,
        feedbackMode: form.feedbackMode,
      })
      toast.success("Settings updated")
      onSaved()
    } catch (e) { toast.error(errorMessage(e)) } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit mock exam settings</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
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
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={saving || !form.title.trim()}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />} Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
