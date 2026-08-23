import { useState } from "react"
import { toast } from "sonner"
import { errorMessage } from "@/lib/api"
import type { QuestionType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus } from "lucide-react"

export interface QuestionPayload {
  text: string
  type: QuestionType
  options: { text: string; correct: boolean }[]
}

/** Reusable "add a question" editor. Parent supplies the persistence via {@link onSave}. */
export function QuestionEditor({ onSave }: { onSave: (payload: QuestionPayload) => Promise<void> }) {
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
      await onSave({ text, type, options: options.filter((o) => o.text.trim()) })
      setText("")
      setType("MULTIPLE_CHOICE")
      setOptions([{ text: "", correct: true }, { text: "", correct: false }])
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
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
