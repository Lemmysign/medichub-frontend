import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { MockExamResponse, PagedResponse } from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState, EmptyState } from "@/components/common"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Clock, Loader2, Plus, Trash2 } from "lucide-react"

export function MockExamsListPage() {
  const { data, loading, error, reload } = useApi(
    () => api.get<PagedResponse<MockExamResponse>>("/mock-exams", { params: { size: 50 } }).then((r) => r.data),
    [],
  )
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: "", description: "", passMarkPercent: 50, durationMinutes: 30 })
  const [saving, setSaving] = useState(false)

  async function create() {
    setSaving(true)
    try {
      await api.post("/mock-exams", form)
      toast.success("Mock exam created")
      setOpen(false)
      setForm({ title: "", description: "", passMarkPercent: 50, durationMinutes: 30 })
      reload()
    } catch (e) { toast.error(errorMessage(e)) } finally { setSaving(false) }
  }
  async function togglePublish(m: MockExamResponse) {
    try { await api.patch(`/mock-exams/${m.id}/publish`, null, { params: { published: !m.published } }); reload() }
    catch (e) { toast.error(errorMessage(e)) }
  }
  async function remove(m: MockExamResponse) {
    if (!confirm(`Delete "${m.title}"?`)) return
    try { await api.delete(`/mock-exams/${m.id}`); toast.success("Deleted"); reload() }
    catch (e) { toast.error(errorMessage(e)) }
  }

  return (
    <>
      <PageHeader
        title="Mock Exams"
        description="Standalone, timed exams for subscribers — not tied to any course"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 size-4" /> New mock exam</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create mock exam</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Pass mark %</Label><Input type="number" min={0} max={100} value={form.passMarkPercent} onChange={(e) => setForm({ ...form, passMarkPercent: Number(e.target.value) })} /></div>
                  <div className="space-y-2"><Label>Duration (min)</Label><Input type="number" min={1} value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} /></div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={create} disabled={saving || !form.title.trim()}>
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
        <div className="grid gap-4">
          {data.content.map((m) => (
            <Card key={m.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="min-w-[220px] flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{m.title}</p>
                  <Badge variant={m.published ? "default" : "secondary"}>{m.published ? "Published" : "Draft"}</Badge>
                </div>
                <p className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{m.questionCount} questions</span>
                  <span className="flex items-center gap-1"><Clock className="size-3" /> {m.durationMinutes} min</span>
                  <span>pass {m.passMarkPercent}%</span>
                  {m.ownerName && <span>· by {m.ownerName}</span>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => togglePublish(m)}>{m.published ? "Unpublish" : "Publish"}</Button>
                <Button asChild size="sm"><Link to={`${m.id}`}>Manage</Link></Button>
                <Button variant="ghost" size="sm" onClick={() => remove(m)}><Trash2 className="size-4 text-destructive" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
