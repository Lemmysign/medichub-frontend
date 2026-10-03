import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import { useSubjects } from "@/hooks/useSubjects"
import { useConfirm } from "@/components/ConfirmDialogProvider"
import type { MockExamResponse, PagedResponse } from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState, EmptyState } from "@/components/common"
import { Pagination } from "@/components/ui/pagination"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Calendar, FileQuestion, History, Loader2, Plus, Trash2, Upload } from "lucide-react"

const selectCls =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"

/** Creator-side Recall paper management. {@code basePath} is the route prefix for Manage links. */
export function RecallsListPage({ basePath }: { basePath: string }) {
  const navigate = useNavigate()
  const subjects = useSubjects()
  const confirm = useConfirm()
  const [page, setPage] = useState(0)
  const { data, loading, error, reload } = useApi(
    () => api.get<PagedResponse<MockExamResponse>>("/recalls", {
      params: { page, size: 12 },
    }).then((r) => r.data),
    [page],
  )
  const emptyForm = { title: "", description: "", subjectId: 0 }
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function create() {
    setSaving(true)
    try {
      const res = await api.post<MockExamResponse>("/recalls", {
        title: form.title,
        description: form.description,
        subjectId: form.subjectId,
      })
      toast.success("Recall created — now upload its questions")
      setOpen(false)
      setForm(emptyForm)
      // Straight to manage, where the bulk-upload (spreadsheet) import lives.
      navigate(`${basePath}/${res.data.id}`)
    } catch (e) { toast.error(errorMessage(e)) } finally { setSaving(false) }
  }
  async function togglePublish(m: MockExamResponse) {
    try { await api.patch(`/recalls/${m.id}/publish`, null, { params: { published: !m.published } }); reload() }
    catch (e) { toast.error(errorMessage(e)) }
  }
  async function remove(m: MockExamResponse) {
    if (!(await confirm(`Delete "${m.title}"? This cannot be undone.`))) return
    try { await api.delete(`/recalls/${m.id}`); toast.success("Deleted"); reload() }
    catch (e) { toast.error(errorMessage(e)) }
  }

  return (
    <>
      <PageHeader
        title="Recalls"
        description="Past-question papers tagged by subject. Students study them — no timing or scoring."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 size-4" /> New recall</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create recall paper</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                  <Upload className="mr-1 inline size-3.5 text-primary" />
                  After creating, you'll go straight to the paper where you can <span className="font-600">bulk-upload</span> all its questions, answers and explanations from a spreadsheet.
                </div>
                <div className="space-y-2"><Label>Title</Label><Input placeholder="e.g. MDCN Pathology — 2024 recall" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <select className={selectCls} value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: Number(e.target.value) })}>
                    <option value={0} disabled>Select subject…</option>
                    {(subjects.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2"><Label>Description (optional)</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button onClick={create} disabled={saving || !form.title.trim() || !form.subjectId}>
                  {saving && <Loader2 className="mr-2 size-4 animate-spin" />} Create & add questions
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? <CenteredSpinner /> : error ? <ErrorState message={error} /> : !data || data.content.length === 0 ? (
        <EmptyState title="No recalls yet" description="Create a recall paper, then bulk-upload its past questions." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {data.content.map((m) => (
            <Card key={m.id} className="flex flex-col p-5 transition-all hover:shadow-md">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-warning/10 text-warning">
                  <History className="size-5" />
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
                    {m.examYear && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-600 text-warning">
                        <Calendar className="size-3" /> {m.examYear}
                      </span>
                    )}
                    {m.ownerName && <span className="text-xs text-muted-foreground">by {m.ownerName}</span>}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                <FileQuestion className="size-4" /> {m.questionCount} question{m.questionCount === 1 ? "" : "s"}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                  <Switch checked={m.published} onCheckedChange={() => togglePublish(m)} aria-label={m.published ? "Unpublish recall" : "Publish recall"} />
                  {m.published ? "Live" : "Hidden"}
                </label>
                <div className="flex items-center gap-1">
                  <Button asChild size="sm"><Link to={`${m.id}`}>Manage</Link></Button>
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => remove(m)} aria-label="Delete recall"><Trash2 className="size-4 text-destructive" /></Button>
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
