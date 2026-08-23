import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { CourseResponse, PagedResponse } from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState, EmptyState } from "@/components/common"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog"
import { Loader2, Plus, Trash2 } from "lucide-react"

export function InstructorCoursesPage() {
  const { data, loading, error, reload } = useApi(
    () => api.get<PagedResponse<CourseResponse>>("/instructor/courses", { params: { size: 50 } }).then((r) => r.data),
    [],
  )
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
    if (!confirm(`Delete "${c.title}"? This cannot be undone.`)) return
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
        <div className="grid gap-4">
          {data.content.map((c) => (
            <Card key={c.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="min-w-[200px] flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{c.title}</p>
                  <Badge variant={c.published ? "default" : "secondary"}>{c.published ? "Published" : "Draft"}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{c.topicCount} topics</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => togglePublish(c)}>
                  {c.published ? "Unpublish" : "Publish"}
                </Button>
                <Button asChild size="sm">
                  <Link to={`/instructor/courses/${c.id}`}>Manage</Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => remove(c)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
