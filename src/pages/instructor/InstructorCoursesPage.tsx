import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import { useConfirm } from "@/components/ConfirmDialogProvider"
import type { CourseResponse, PagedResponse } from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState, EmptyState } from "@/components/common"
import { Pagination } from "@/components/ui/pagination"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog"
import { BookOpen, Loader2, Plus, Trash2 } from "lucide-react"

export function InstructorCoursesPage() {
  const [page, setPage] = useState(0)
  const { data, loading, error, reload } = useApi(
    () => api.get<PagedResponse<CourseResponse>>("/instructor/courses", { params: { page, size: 12 } }).then((r) => r.data),
    [page],
  )
  const confirm = useConfirm()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: "", description: "" })
  const [saving, setSaving] = useState(false)

  async function create() {
    setSaving(true)
    try {
      await api.post("/instructor/courses", form)
      toast.success("Course created")
      setOpen(false)
      setForm({ title: "", description: "" })
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  async function togglePublish(c: CourseResponse) {
    try {
      await api.patch(`/instructor/courses/${c.id}/publish`, null, { params: { published: !c.published } })
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  async function remove(c: CourseResponse) {
    if (!(await confirm(`Delete "${c.title}"? This cannot be undone.`))) return
    try {
      await api.delete(`/instructor/courses/${c.id}`)
      toast.success("Course deleted")
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <>
      <PageHeader
        title="My courses"
        description="Create and manage your courses"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 size-4" /> New course</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create course</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Description</Label>
                  <Textarea id="desc" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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

      {loading ? (
        <CenteredSpinner />
      ) : error ? (
        <ErrorState message={error} />
      ) : !data || data.content.length === 0 ? (
        <EmptyState title="No courses yet" description="Create your first course to get started." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {data.content.map((c) => (
            <Card key={c.id} className="group flex flex-col overflow-hidden p-0 transition-all hover:shadow-md">
              {/* Thumbnail */}
              <Link to={`/instructor/courses/${c.id}`} className="relative block aspect-video w-full overflow-hidden bg-muted">
                {c.thumbnailUrl ? (
                  <img src={c.thumbnailUrl} alt="" className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/15 to-accent">
                    <BookOpen className="size-9 text-primary/40" />
                  </div>
                )}
                <span className={"font-700 absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-widest " +
                  (c.published ? "bg-success text-success-foreground" : "bg-background/90 text-muted-foreground")}>
                  {c.published ? "Published" : "Draft"}
                </span>
              </Link>

              {/* Body */}
              <div className="flex flex-1 flex-col p-4">
                <Link to={`/instructor/courses/${c.id}`} className="font-700 line-clamp-2 hover:text-primary">{c.title}</Link>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <BookOpen className="size-3.5" /> {c.topicCount} topic{c.topicCount === 1 ? "" : "s"}
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                    <Switch checked={c.published} onCheckedChange={() => togglePublish(c)} aria-label={c.published ? "Unpublish course" : "Publish course"} />
                    {c.published ? "Live" : "Hidden"}
                  </label>
                  <div className="flex items-center gap-1">
                    <Button asChild size="sm"><Link to={`/instructor/courses/${c.id}`}>Manage</Link></Button>
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => remove(c)} aria-label="Delete course">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
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
