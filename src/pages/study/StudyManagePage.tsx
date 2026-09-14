import { useRef, useState } from "react"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import { useSubjects } from "@/hooks/useSubjects"
import type { DownloadUrlResponse, PagedResponse, StudyMaterialResponse } from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState, EmptyState } from "@/components/common"
import { Pagination } from "@/components/ui/pagination"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { ExternalLink, FileText, Loader2, Plus, Tag, Trash2, Upload } from "lucide-react"

const selectCls =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"

export function StudyManagePage() {
  const subjects = useSubjects()
  const [page, setPage] = useState(0)
  const { data, loading, error, reload } = useApi(
    () => api.get<PagedResponse<StudyMaterialResponse>>("/study", { params: { page, size: 15 } }).then((r) => r.data),
    [page],
  )
  const [open, setOpen] = useState(false)
  const emptyForm = { title: "", description: "", subjectId: 0 }
  const [form, setForm] = useState(emptyForm)
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function create() {
    if (!file) { toast.error("Choose a PDF or Word file"); return }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append("title", form.title.trim())
      if (form.description.trim()) fd.append("description", form.description.trim())
      if (form.subjectId) fd.append("subjectId", String(form.subjectId))
      fd.append("file", file)
      await api.post("/study", fd, { headers: { "Content-Type": "multipart/form-data" } })
      toast.success("Study document uploaded")
      setOpen(false); setForm(emptyForm); setFile(null)
      if (fileRef.current) fileRef.current.value = ""
      reload()
    } catch (e) { toast.error(errorMessage(e)) } finally { setSaving(false) }
  }
  async function togglePublish(d: StudyMaterialResponse) {
    try { await api.patch(`/study/${d.id}/publish`, null, { params: { published: !d.published } }); reload() }
    catch (e) { toast.error(errorMessage(e)) }
  }
  async function remove(d: StudyMaterialResponse) {
    if (!confirm(`Delete "${d.title}"?`)) return
    try { await api.delete(`/study/${d.id}`); toast.success("Deleted"); reload() }
    catch (e) { toast.error(errorMessage(e)) }
  }
  async function preview(d: StudyMaterialResponse) {
    try {
      const res = await api.get<DownloadUrlResponse>(`/study/${d.id}/view`)
      window.open(res.data.url, "_blank", "noopener")
    } catch (e) { toast.error(errorMessage(e)) }
  }

  return (
    <>
      <PageHeader
        title="Study"
        description="Upload PDFs or Word docs for students to read in-browser. Publish when ready."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 size-4" /> Upload document</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Upload study document</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Pathology — Cell Injury notes" /></div>
                <div className="space-y-2">
                  <Label>Subject (optional)</Label>
                  <select className={selectCls} value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: Number(e.target.value) })}>
                    <option value={0}>No subject</option>
                    {(subjects.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2"><Label>Description (optional)</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>File (PDF or Word)</Label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-600 file:text-primary-foreground hover:file:opacity-90"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={create} disabled={saving || !form.title.trim() || !file}>
                  {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />} Upload
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? <CenteredSpinner /> : error ? <ErrorState message={error} /> : !data || data.content.length === 0 ? (
        <EmptyState title="No study documents yet" description="Upload a PDF or Word document to get started." />
      ) : (
        <Card className="divide-y p-0">
          {data.content.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><FileText className="size-5" /></div>
              <div className="min-w-[200px] flex-1">
                <p className="font-600">{d.title}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {d.subjectName && <span className="inline-flex items-center gap-1"><Tag className="size-3" /> {d.subjectName}</span>}
                  <span className="truncate">{d.fileName}</span>
                  {d.ownerName && <span>by {d.ownerName}</span>}
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <Switch checked={d.published} onCheckedChange={() => togglePublish(d)} aria-label={d.published ? "Unpublish" : "Publish"} />
                {d.published ? "Live" : "Hidden"}
              </label>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" onClick={() => preview(d)}><ExternalLink className="mr-1 size-4" /> Preview</Button>
                <Button size="icon" variant="ghost" className="size-8" onClick={() => remove(d)} aria-label="Delete"><Trash2 className="size-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </Card>
      )}
      {data && <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />}
    </>
  )
}
