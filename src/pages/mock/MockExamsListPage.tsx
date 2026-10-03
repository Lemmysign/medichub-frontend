import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import { useSubjects } from "@/hooks/useSubjects"
import { useConfirm } from "@/components/ConfirmDialogProvider"
import type { FeedbackMode, MockExamResponse, PagedResponse } from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState, EmptyState } from "@/components/common"
import { Pagination } from "@/components/ui/pagination"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Clock, ClipboardList, FileQuestion, Loader2, Plus, Target, Trash2 } from "lucide-react"

export function MockExamsListPage() {
  const subjects = useSubjects()
  const confirm = useConfirm()
  const [page, setPage] = useState(0)
  const { data, loading, error, reload } = useApi(
    () => api.get<PagedResponse<MockExamResponse>>("/mock-exams", { params: { page, size: 15 } }).then((r) => r.data),
    [page],
  )
  const emptyForm = { title: "", description: "", passMarkPercent: 50, timed: true, durationMinutes: 30, feedbackMode: "ON_SUBMISSION" as FeedbackMode, subjectId: 0 }
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function create() {
    setSaving(true)
    try {
      await api.post("/mock-exams", {
        title: form.title,
        description: form.description,
        passMarkPercent: form.passMarkPercent,
        durationMinutes: form.timed ? form.durationMinutes : null,
        feedbackMode: form.feedbackMode,
        subjectId: form.subjectId,
      })
      toast.success("Mock exam created")
      setOpen(false)
      setForm(emptyForm)
      reload()
    } catch (e) { toast.error(errorMessage(e)) } finally { setSaving(false) }
  }
  async function togglePublish(m: MockExamResponse) {
    try { await api.patch(`/mock-exams/${m.id}/publish`, null, { params: { published: !m.published } }); reload() }
    catch (e) { toast.error(errorMessage(e)) }
  }
  async function remove(m: MockExamResponse) {
    if (!(await confirm(`Delete "${m.title}"? This cannot be undone.`))) return
    try { await api.delete(`/mock-exams/${m.id}`); toast.success("Deleted"); reload() }
    catch (e) { toast.error(errorMessage(e)) }
  }

  return (
    <>
      <PageHeader
        title="Mock Exam"
        description="Subject-tagged practice exams for subscribers — auto-graded, timed or self-paced"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 size-4" /> New Mock Exam</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Mock Exam</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
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
                <Button onClick={create} disabled={saving || !form.title.trim() || !form.subjectId}>
                  {saving && <Loader2 className="mr-2 size-4 animate-spin" />} Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? <CenteredSpinner /> : error ? <ErrorState message={error} /> : !data || data.content.length === 0 ? (
        <EmptyState title="No mock exams yet" description="Create one and add questions, then publish it for subscribers." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {data.content.map((m) => (
            <Card key={m.id} className="flex flex-col p-5 transition-all hover:shadow-md">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <ClipboardList className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`${m.id}`} className="font-700 line-clamp-2 hover:text-primary">{m.title}</Link>
                    <span className={"font-700 shrink-0 rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-widest " +
                      (m.published ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>
                      {m.published ? "Live" : "Draft"}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {m.ownerName && <span className="text-xs text-muted-foreground">by {m.ownerName}</span>}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><FileQuestion className="size-4" /> {m.questionCount} questions</span>
                <span className="flex items-center gap-1"><Clock className="size-4" /> {m.durationMinutes ? `${m.durationMinutes} min` : "Untimed"}</span>
                <span className="flex items-center gap-1"><Target className="size-4" /> {m.passMarkPercent}%</span>
                <span>{m.feedbackMode === "IMMEDIATE" ? "Study mode" : "Exam mode"}</span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                  <Switch checked={m.published} onCheckedChange={() => togglePublish(m)} aria-label={m.published ? "Unpublish exam" : "Publish exam"} />
                  {m.published ? "Live" : "Hidden"}
                </label>
                <div className="flex items-center gap-1">
                  <Button asChild size="sm"><Link to={`${m.id}`}>Manage</Link></Button>
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => remove(m)} aria-label="Delete exam"><Trash2 className="size-4 text-destructive" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {data && <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />}
    </>
  )
}
