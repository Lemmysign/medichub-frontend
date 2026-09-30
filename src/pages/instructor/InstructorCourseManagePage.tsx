import { useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import { useConfirm } from "@/components/ConfirmDialogProvider"
import type { CourseResponse, FeedbackMode, MaterialResponse, QuestionResponse, TestResponse, TopicResponse } from "@/lib/types"
import { QuestionEditor, type QuestionPayload } from "@/components/QuestionEditor"
import { BulkImportDialog } from "@/components/BulkImportDialog"
import { PageHeader, CenteredSpinner, ErrorState } from "@/components/common"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, ClipboardList, FileText, Loader2, Pencil, Plus, Target, Trash2, Upload, Video } from "lucide-react"

const LETTERS = "ABCDEFGHIJ"

/** Segmented Study/Exam feedback-mode control, reused by the create dialog and config editor. */
function FeedbackToggle({ value, onChange }: { value: FeedbackMode; onChange: (v: FeedbackMode) => void }) {
  const opts: { v: FeedbackMode; label: string; hint: string }[] = [
    { v: "IMMEDIATE", label: "Study", hint: "Reveal on each wrong answer" },
    { v: "ON_SUBMISSION", label: "Exam", hint: "Reveal after submit" },
  ]
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={"rounded-md px-3 py-2 text-left transition-colors " + (value === o.v ? "bg-card shadow-sm" : "hover:bg-card/50")}
        >
          <div className={"font-700 text-xs " + (value === o.v ? "text-foreground" : "text-muted-foreground")}>{o.label} mode</div>
          <div className="text-[10px] text-muted-foreground">{o.hint}</div>
        </button>
      ))}
    </div>
  )
}

export function InstructorCourseManagePage() {
  const { id } = useParams()
  const courseId = Number(id)
  const course = useApi(() => api.get<CourseResponse>(`/instructor/courses/${courseId}`).then((r) => r.data), [courseId])

  if (course.loading) return <CenteredSpinner />
  if (course.error) return <ErrorState message={course.error} />

  async function togglePublish() {
    try {
      await api.patch(`/instructor/courses/${courseId}/publish`, null, { params: { published: !course.data!.published } })
      course.reload()
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <>
      <PageHeader
        title={course.data!.title}
        description="Manage details, topics, materials and tests"
        action={
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <Switch checked={course.data!.published} onCheckedChange={togglePublish} aria-label={course.data!.published ? "Unpublish course" : "Publish course"} />
              {course.data!.published ? "Published" : "Draft"}
            </label>
            <Button asChild variant="outline"><Link to="/instructor/courses">Back</Link></Button>
          </div>
        }
      />
      <ThumbnailUploader courseId={courseId} current={course.data!.thumbnailUrl} onDone={course.reload} />
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="mt-4"><DetailsTab course={course.data!} onSaved={course.reload} /></TabsContent>
        <TabsContent value="topics" className="mt-4"><TopicsTab courseId={courseId} /></TabsContent>
        <TabsContent value="materials" className="mt-4"><MaterialsTab courseId={courseId} /></TabsContent>
        <TabsContent value="tests" className="mt-4"><TestsTab courseId={courseId} /></TabsContent>
      </Tabs>
    </>
  )
}

function DetailsTab({ course, onSaved }: { course: CourseResponse; onSaved: () => void }) {
  const [title, setTitle] = useState(course.title)
  const [description, setDescription] = useState(course.description ?? "")
  const [saving, setSaving] = useState(false)

  const dirty = title.trim() !== course.title || (description ?? "") !== (course.description ?? "")

  async function save() {
    if (!title.trim()) return
    setSaving(true)
    try {
      await api.put(`/instructor/courses/${course.id}`, { title: title.trim(), description })
      toast.success("Course details updated")
      onSaved()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="max-w-2xl space-y-4 p-5">
      <div className="space-y-2">
        <Label htmlFor="course-title">Course title</Label>
        <Input id="course-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="course-desc">Description</Label>
        <Textarea
          id="course-desc"
          rows={8}
          value={description}
          maxLength={5000}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this course covers, who it's for, and what students will learn…"
        />
        <p className="text-right text-xs text-muted-foreground">{description.length}/5000</p>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={save} disabled={saving || !title.trim() || !dirty}>
          {saving && <Loader2 className="mr-2 size-4 animate-spin" />} Save changes
        </Button>
        {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
      </div>
    </Card>
  )
}

function ThumbnailUploader({ courseId, current, onDone }: { courseId: number; current: string | null; onDone: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      await api.post(`/instructor/courses/${courseId}/thumbnail`, fd, { headers: { "Content-Type": undefined } })
      toast.success("Thumbnail updated")
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <Card className="mb-4 flex items-center gap-4 p-4">
      <div className="flex aspect-video w-40 items-center justify-center overflow-hidden rounded-md bg-muted">
        {current ? <img src={current} alt="thumbnail" className="size-full object-cover" /> : <span className="text-xs text-muted-foreground">No thumbnail</span>}
      </div>
      <div>
        <p className="text-sm font-medium">Course thumbnail</p>
        <p className="text-xs text-muted-foreground">Shown on the catalog. JPG or PNG.</p>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={upload} />
        <Button className="mt-2" size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />} Upload
        </Button>
      </div>
    </Card>
  )
}

function TopicsTab({ courseId }: { courseId: number }) {
  const { data, loading, error, reload } = useApi(
    () => api.get<TopicResponse[]>(`/instructor/courses/${courseId}/topics`).then((r) => r.data),
    [courseId],
  )
  const confirm = useConfirm()
  const [title, setTitle] = useState("")
  const [busy, setBusy] = useState(false)

  async function add() {
    if (!title.trim()) return
    setBusy(true)
    try {
      await api.post(`/instructor/courses/${courseId}/topics`, { title })
      setTitle("")
      reload()
    } catch (e) { toast.error(errorMessage(e)) } finally { setBusy(false) }
  }
  async function remove(topicId: number) {
    if (!(await confirm("Delete this topic? This cannot be undone."))) return
    try { await api.delete(`/instructor/courses/${courseId}/topics/${topicId}`); reload() }
    catch (e) { toast.error(errorMessage(e)) }
  }
  async function createVideo(topicId: number) {
    try {
      const res = await api.post(`/instructor/courses/${courseId}/topics/${topicId}/video`)
      toast.success(`Bunny video created (GUID ${String(res.data.bunnyVideoId).slice(0, 8)}…). Use the returned TUS credential to upload.`)
      reload()
    } catch (e) { toast.error(errorMessage(e)) }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="New topic title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Button onClick={add} disabled={busy}><Plus className="mr-1 size-4" /> Add</Button>
      </div>
      {loading ? <CenteredSpinner /> : error ? <ErrorState message={error} /> : (
        <Card className="divide-y p-0">
          {data!.map((t, i) => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3">
              <span className="w-5 text-sm text-muted-foreground">{i + 1}</span>
              <span className="flex-1 text-sm">{t.title}</span>
              {t.hasVideo ? <Badge variant="secondary" className="gap-1"><Video className="size-3" /> Video</Badge> : null}
              <Button size="sm" variant="ghost" onClick={() => createVideo(t.id)}>
                <Video className="mr-1 size-4" /> {t.hasVideo ? "Replace" : "Add"} video
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="size-4 text-destructive" /></Button>
            </div>
          ))}
          {data!.length === 0 && <div className="px-4 py-6 text-sm text-muted-foreground">No topics yet.</div>}
        </Card>
      )}
    </div>
  )
}

function MaterialsTab({ courseId }: { courseId: number }) {
  const { data, loading, error, reload } = useApi(
    () => api.get<MaterialResponse[]>(`/instructor/courses/${courseId}/materials`).then((r) => r.data),
    [courseId],
  )
  const fileRef = useRef<HTMLInputElement>(null)
  const confirm = useConfirm()
  const [uploading, setUploading] = useState(false)

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      await api.post(`/instructor/courses/${courseId}/materials`, fd, { headers: { "Content-Type": undefined } })
      toast.success("Material uploaded")
      reload()
    } catch (err) { toast.error(errorMessage(err)) }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = "" }
  }
  async function remove(materialId: number) {
    if (!(await confirm("Delete this material? This cannot be undone."))) return
    try { await api.delete(`/instructor/courses/${courseId}/materials/${materialId}`); reload() }
    catch (e) { toast.error(errorMessage(e)) }
  }

  return (
    <div className="space-y-4">
      <div>
        <input ref={fileRef} type="file" className="hidden" onChange={upload} />
        <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />} Upload material
        </Button>
      </div>
      {loading ? <CenteredSpinner /> : error ? <ErrorState message={error} /> : (
        <Card className="divide-y p-0">
          {data!.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              <FileText className="size-4 text-muted-foreground" />
              <span className="flex-1 text-sm">{m.fileName}</span>
              <Button size="sm" variant="ghost" onClick={() => remove(m.id)}><Trash2 className="size-4 text-destructive" /></Button>
            </div>
          ))}
          {data!.length === 0 && <div className="px-4 py-6 text-sm text-muted-foreground">No materials yet.</div>}
        </Card>
      )}
    </div>
  )
}

function TestsTab({ courseId }: { courseId: number }) {
  const { data, loading, error, reload } = useApi(
    () => api.get<TestResponse[]>(`/instructor/courses/${courseId}/tests`).then((r) => r.data),
    [courseId],
  )
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<{ title: string; passMark: number; feedbackMode: FeedbackMode }>({ title: "", passMark: 50, feedbackMode: "IMMEDIATE" })
  const [saving, setSaving] = useState(false)

  async function createTest() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await api.post(`/instructor/courses/${courseId}/tests`, { title: form.title, passMarkPercent: form.passMark, feedbackMode: form.feedbackMode })
      toast.success("Test created")
      setForm({ title: "", passMark: 50, feedbackMode: "IMMEDIATE" })
      setOpen(false)
      reload()
    } catch (e) { toast.error(errorMessage(e)) } finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data?.length ?? 0} test{(data?.length ?? 0) === 1 ? "" : "s"} in this course</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-1 size-4" /> New test</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create test</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5"><Label>Test title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Upper Limb Anatomy Quiz" /></div>
              <div className="space-y-1.5"><Label>Pass mark %</Label><Input type="number" min={0} max={100} value={form.passMark} onChange={(e) => setForm({ ...form, passMark: Number(e.target.value) })} /></div>
              <div className="space-y-1.5"><Label>Feedback mode</Label><FeedbackToggle value={form.feedbackMode} onChange={(v) => setForm({ ...form, feedbackMode: v })} /></div>
            </div>
            <DialogFooter>
              <Button onClick={createTest} disabled={saving || !form.title.trim()}>{saving && <Loader2 className="mr-2 size-4 animate-spin" />} Create test</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <CenteredSpinner /> : error ? <ErrorState message={error} /> : (data?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <ClipboardList className="mx-auto mb-2 size-8 text-muted-foreground/50" />
          <p className="font-medium">No tests yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create a test, then add questions or import them from a spreadsheet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data!.map((t) => (
            <TestCard key={t.id} courseId={courseId} test={t} onChanged={reload} />
          ))}
        </div>
      )}
    </div>
  )
}

function TestCard({ courseId, test, onChanged }: { courseId: number; test: TestResponse; onChanged: () => void }) {
  const confirm = useConfirm()
  const [open, setOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState(false)
  const [adding, setAdding] = useState(false)
  const [editingQid, setEditingQid] = useState<number | null>(null)
  const qs = useApi(
    () => (open ? api.get<QuestionResponse[]>(`/instructor/courses/${courseId}/tests/${test.id}/questions`).then((r) => r.data) : Promise.resolve([])),
    [open, courseId, test.id],
  )

  async function addQuestion(payload: QuestionPayload) {
    await api.post(`/instructor/courses/${courseId}/tests/${test.id}/questions`, payload)
    toast.success("Question added")
    setAdding(false)
    qs.reload()
    onChanged()
  }
  async function updateQuestion(qid: number, payload: QuestionPayload) {
    await api.put(`/instructor/courses/${courseId}/tests/${test.id}/questions/${qid}`, payload)
    toast.success("Question updated")
    setEditingQid(null)
    qs.reload()
  }
  async function removeQuestion(qid: number) {
    if (!(await confirm("Delete this question? This cannot be undone."))) return
    try { await api.delete(`/instructor/courses/${courseId}/tests/${test.id}/questions/${qid}`); qs.reload(); onChanged() }
    catch (e) { toast.error(errorMessage(e)) }
  }

  return (
    <Card className="overflow-hidden p-0">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><ClipboardList className="size-5" /></div>
          <div>
            <p className="font-700">{test.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><ClipboardList className="size-3.5" /> {test.questionCount} question{test.questionCount === 1 ? "" : "s"}</span>
              <span className="flex items-center gap-1"><Target className="size-3.5" /> Pass {test.passMarkPercent}%</span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">{test.feedbackMode === "IMMEDIATE" ? "Study mode" : "Exam mode"}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" size="sm" onClick={() => setEditingConfig((v) => !v)}><Pencil className="mr-1 size-4" /> Settings</Button>
          <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>{open ? "Close" : "Manage questions"}</Button>
        </div>
      </div>

      {editingConfig && (
        <TestConfigEditor courseId={courseId} test={test} onCancel={() => setEditingConfig(false)} onSaved={() => { setEditingConfig(false); onChanged() }} />
      )}

      {open && (
        <div className="space-y-3 bg-muted/20 p-4">
          {qs.loading ? <CenteredSpinner /> : (
            <div className="space-y-3">
              {(qs.data ?? []).map((q, i) =>
                editingQid === q.id ? (
                  <QuestionEditor
                    key={q.id}
                    initial={{ text: q.text, type: q.type, explanation: q.explanation, imageUrl: q.imageUrl, options: q.options.map((o) => ({ text: o.text, correct: o.correct })) }}
                    onSave={(p) => updateQuestion(q.id, p)}
                    onCancel={() => setEditingQid(null)}
                    submitLabel="Update question"
                  />
                ) : (
                  <div key={q.id} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-600 text-sm"><span className="text-muted-foreground">{i + 1}.</span> {q.text}</p>
                      <div className="flex shrink-0 gap-1">
                        <Button size="icon" variant="ghost" className="size-8" onClick={() => setEditingQid(q.id)} aria-label="Edit question"><Pencil className="size-4" /></Button>
                        <Button size="icon" variant="ghost" className="size-8" onClick={() => removeQuestion(q.id)} aria-label="Delete question"><Trash2 className="size-4 text-destructive" /></Button>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1">
                      {q.options.map((o, oi) => (
                        <div key={o.id} className={"flex items-center gap-2 rounded-md px-2 py-1 text-sm " + (o.correct ? "bg-success/10 text-foreground" : "text-muted-foreground")}>
                          <span className={"font-700 flex size-5 shrink-0 items-center justify-center rounded text-[10px] " + (o.correct ? "bg-success text-success-foreground" : "bg-muted")}>{LETTERS[oi]}</span>
                          <span className="flex-1">{o.text}</span>
                          {o.correct && <CheckCircle2 className="size-4 text-success" />}
                        </div>
                      ))}
                    </div>
                    {q.explanation && <p className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground"><span className="font-600">Explanation:</span> {q.explanation}</p>}
                  </div>
                ),
              )}
              {(qs.data ?? []).length === 0 && <p className="py-2 text-center text-sm text-muted-foreground">No questions yet — add your first below.</p>}
            </div>
          )}

          {/* Add question */}
          {adding ? (
            <QuestionEditor onSave={addQuestion} onCancel={() => setAdding(false)} submitLabel="Add question" />
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={() => setAdding(true)}><Plus className="mr-1 size-4" /> Add question</Button>
              <BulkImportDialog
                endpoint={`/instructor/courses/${courseId}/tests/${test.id}/questions/bulk`}
                onImported={() => { qs.reload(); onChanged() }}
              />
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function TestConfigEditor({ courseId, test, onCancel, onSaved }: { courseId: number; test: TestResponse; onCancel: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(test.title)
  const [passMark, setPassMark] = useState(test.passMarkPercent)
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>(test.feedbackMode)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!title.trim()) return
    setSaving(true)
    try {
      await api.put(`/instructor/courses/${courseId}/tests/${test.id}`, { title, passMarkPercent: passMark, feedbackMode })
      toast.success("Test updated")
      onSaved()
    } catch (e) { toast.error(errorMessage(e)) } finally { setSaving(false) }
  }

  return (
    <div className="space-y-4 border-b border-border bg-muted/30 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label>Test title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Pass mark %</Label><Input type="number" min={0} max={100} value={passMark} onChange={(e) => setPassMark(Number(e.target.value))} /></div>
      </div>
      <div className="space-y-1.5"><Label>Feedback mode</Label><FeedbackToggle value={feedbackMode} onChange={setFeedbackMode} /></div>
      <div className="flex gap-2">
        <Button onClick={save} disabled={saving || !title.trim()}>{saving && <Loader2 className="mr-2 size-4 animate-spin" />} Save</Button>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
      </div>
    </div>
  )
}

