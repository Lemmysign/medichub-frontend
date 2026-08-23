import { useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { CourseResponse, MaterialResponse, QuestionType, TestResponse, TopicResponse } from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState } from "@/components/common"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { FileText, Loader2, Plus, Trash2, Upload, Video } from "lucide-react"

export function InstructorCourseManagePage() {
  const { id } = useParams()
  const courseId = Number(id)
  const course = useApi(() => api.get<CourseResponse>(`/instructor/courses/${courseId}`).then((r) => r.data), [courseId])

  if (course.loading) return <CenteredSpinner />
  if (course.error) return <ErrorState message={course.error} />

  return (
    <>
      <PageHeader
        title={course.data!.title}
        description="Manage topics, materials and tests"
        action={<Button asChild variant="outline"><Link to="/instructor/courses">Back</Link></Button>}
      />
      <Tabs defaultValue="topics">
        <TabsList>
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
        </TabsList>
        <TabsContent value="topics" className="mt-4"><TopicsTab courseId={courseId} /></TabsContent>
        <TabsContent value="materials" className="mt-4"><MaterialsTab courseId={courseId} /></TabsContent>
        <TabsContent value="tests" className="mt-4"><TestsTab courseId={courseId} /></TabsContent>
      </Tabs>
    </>
  )
}

function TopicsTab({ courseId }: { courseId: number }) {
  const { data, loading, error, reload } = useApi(
    () => api.get<TopicResponse[]>(`/instructor/courses/${courseId}/topics`).then((r) => r.data),
    [courseId],
  )
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
    if (!confirm("Delete this topic?")) return
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
    if (!confirm("Delete this material?")) return
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
  const [title, setTitle] = useState("")
  const [passMark, setPassMark] = useState(50)
  const [activeTest, setActiveTest] = useState<number | null>(null)

  async function createTest() {
    if (!title.trim()) return
    try {
      await api.post(`/instructor/courses/${courseId}/tests`, { title, passMarkPercent: passMark })
      setTitle("")
      reload()
    } catch (e) { toast.error(errorMessage(e)) }
  }

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-end gap-3 p-4">
        <div className="flex-1 space-y-1"><Label>Test title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="w-32 space-y-1"><Label>Pass mark %</Label><Input type="number" min={0} max={100} value={passMark} onChange={(e) => setPassMark(Number(e.target.value))} /></div>
        <Button onClick={createTest}><Plus className="mr-1 size-4" /> Create test</Button>
      </Card>
      {loading ? <CenteredSpinner /> : error ? <ErrorState message={error} /> : (
        <div className="space-y-3">
          {data!.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-sm text-muted-foreground">{t.questionCount} questions • pass {t.passMarkPercent}%</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setActiveTest(activeTest === t.id ? null : t.id)}>
                  {activeTest === t.id ? "Close" : "Add questions"}
                </Button>
              </div>
              {activeTest === t.id && <QuestionEditor courseId={courseId} testId={t.id} onSaved={reload} />}
            </Card>
          ))}
          {data!.length === 0 && <p className="text-sm text-muted-foreground">No tests yet.</p>}
        </div>
      )}
    </div>
  )
}

function QuestionEditor({ courseId, testId, onSaved }: { courseId: number; testId: number; onSaved: () => void }) {
  const [text, setText] = useState("")
  const [type, setType] = useState<QuestionType>("MULTIPLE_CHOICE")
  const [options, setOptions] = useState([
    { text: "", correct: true },
    { text: "", correct: false },
  ])
  const [saving, setSaving] = useState(false)

  function setOpt(i: number, patch: Partial<{ text: string; correct: boolean }>) {
    setOptions(options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)))
  }

  async function save() {
    setSaving(true)
    try {
      await api.post(`/instructor/courses/${courseId}/tests/${testId}/questions`, {
        text, type, options: options.filter((o) => o.text.trim()),
      })
      toast.success("Question added")
      setText("")
      setOptions([{ text: "", correct: true }, { text: "", correct: false }])
      onSaved()
    } catch (e) { toast.error(errorMessage(e)) } finally { setSaving(false) }
  }

  return (
    <div className="mt-4 space-y-3 rounded-lg border bg-muted/30 p-4">
      <div className="space-y-1"><Label>Question</Label><Input value={text} onChange={(e) => setText(e.target.value)} /></div>
      <div className="space-y-1">
        <Label>Type</Label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as QuestionType)}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
        >
          <option value="MULTIPLE_CHOICE">Multiple choice</option>
          <option value="SINGLE_CHOICE">Single choice</option>
          <option value="TRUE_FALSE">True / False</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label>Options (tick the correct one)</Label>
        {options.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="checkbox" checked={o.correct} onChange={(e) => setOpt(i, { correct: e.target.checked })} className="size-4" />
            <Input value={o.text} onChange={(e) => setOpt(i, { text: e.target.value })} placeholder={`Option ${i + 1}`} />
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={() => setOptions([...options, { text: "", correct: false }])} disabled={options.length >= 6}>
          <Plus className="mr-1 size-4" /> Add option
        </Button>
      </div>
      <Button onClick={save} disabled={saving || !text.trim()}>
        {saving && <Loader2 className="mr-2 size-4 animate-spin" />} Save question
      </Button>
    </div>
  )
}
