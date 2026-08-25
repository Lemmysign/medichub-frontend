import { useState } from "react"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { SubjectResponse } from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState, EmptyState } from "@/components/common"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Tags } from "lucide-react"

export function AdminSubjectsPage() {
  const { data, loading, error, reload } = useApi(
    () => api.get<SubjectResponse[]>("/admin/subjects").then((r) => r.data),
    [],
  )
  const [addOpen, setAddOpen] = useState(false)
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<SubjectResponse | null>(null)

  const subjects = data ?? []

  async function add() {
    setSaving(true)
    try {
      await api.post("/admin/subjects", { name })
      toast.success("Subject added")
      setAddOpen(false); setName(""); reload()
    } catch (e) { toast.error(errorMessage(e)) } finally { setSaving(false) }
  }

  async function save(s: SubjectResponse, patch: Partial<SubjectResponse>) {
    try {
      await api.put(`/admin/subjects/${s.id}`, {
        name: patch.name ?? s.name,
        orderIndex: patch.orderIndex ?? s.orderIndex,
        active: patch.active ?? s.active,
      })
      reload()
    } catch (e) { toast.error(errorMessage(e)) }
  }

  async function move(s: SubjectResponse, dir: -1 | 1) {
    const sorted = [...subjects].sort((a, b) => a.orderIndex - b.orderIndex)
    const i = sorted.findIndex((x) => x.id === s.id)
    const j = i + dir
    if (j < 0 || j >= sorted.length) return
    const other = sorted[j]
    // Swap order indices.
    await save(s, { orderIndex: other.orderIndex })
    await save(other, { orderIndex: s.orderIndex })
  }

  return (
    <>
      <PageHeader
        title="Subjects"
        description="The taxonomy used to tag MCQs and Recalls. Students filter by these."
        action={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 size-4" /> New subject</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add subject</DialogTitle></DialogHeader>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input placeholder="e.g. Psychiatry" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <DialogFooter>
                <Button onClick={add} disabled={saving || !name.trim()}>
                  {saving && <Loader2 className="mr-2 size-4 animate-spin" />} Add
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? <CenteredSpinner /> : error ? <ErrorState message={error} /> : subjects.length === 0 ? (
        <EmptyState title="No subjects yet" description="Add the first subject to start tagging content." />
      ) : (
        <Card className="divide-y p-0">
          {[...subjects].sort((a, b) => a.orderIndex - b.orderIndex).map((s, i, arr) => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <Tags className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={"font-600 " + (s.active ? "" : "text-muted-foreground line-through")}>{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.slug}</p>
              </div>
              <div className="flex flex-col">
                <button className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={i === 0} onClick={() => move(s, -1)} aria-label="Move up"><ArrowUp className="size-4" /></button>
                <button className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={i === arr.length - 1} onClick={() => move(s, 1)} aria-label="Move down"><ArrowDown className="size-4" /></button>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <Switch checked={s.active} onCheckedChange={(v) => save(s, { active: v })} aria-label={s.active ? "Deactivate" : "Activate"} />
                {s.active ? "Active" : "Hidden"}
              </label>
              <Button size="icon" variant="ghost" className="size-8" onClick={() => setEditing(s)} aria-label="Rename"><Pencil className="size-4" /></Button>
            </div>
          ))}
        </Card>
      )}

      {editing && (
        <EditSubjectDialog subject={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />
      )}
    </>
  )
}

function EditSubjectDialog({ subject, onClose, onSaved }: { subject: SubjectResponse; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(subject.name)
  const [saving, setSaving] = useState(false)
  async function save() {
    setSaving(true)
    try {
      await api.put(`/admin/subjects/${subject.id}`, { name, orderIndex: subject.orderIndex, active: subject.active })
      toast.success("Subject updated")
      onSaved()
    } catch (e) { toast.error(errorMessage(e)) } finally { setSaving(false) }
  }
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Rename subject</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={saving || !name.trim()}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
