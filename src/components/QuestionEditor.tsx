import { useRef, useState } from "react"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import type { QuestionType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { CheckCircle2, Circle, ImagePlus, Loader2, Plus, X } from "lucide-react"

export interface QuestionPayload {
  text: string
  type: QuestionType
  explanation: string | null
  imageUrl: string | null
  options: { text: string; correct: boolean }[]
}

export interface QuestionInitial {
  text: string
  type: QuestionType
  explanation: string | null
  imageUrl: string | null
  options: { text: string; correct: boolean }[]
}

type Opt = { text: string; correct: boolean }

const LETTERS = "ABCDEFGHIJ"
const isSingle = (t: QuestionType) => t === "SINGLE_CHOICE" || t === "TRUE_FALSE"

const TYPE_OPTIONS: { value: QuestionType; label: string; hint: string }[] = [
  { value: "SINGLE_CHOICE", label: "Single choice", hint: "One correct answer" },
  { value: "MULTIPLE_CHOICE", label: "Multiple choice", hint: "One or more correct" },
  { value: "TRUE_FALSE", label: "True / False", hint: "Exactly one correct" },
]

/**
 * Premium question authoring surface. Pass {@link initial} to edit (pre-filled, Cancel shown);
 * omit it to add (resets after save). Give a stable `key` per question when editing a list.
 */
export function QuestionEditor({
  onSave,
  initial,
  onCancel,
  submitLabel = "Save question",
}: {
  onSave: (payload: QuestionPayload) => Promise<void>
  initial?: QuestionInitial
  onCancel?: () => void
  submitLabel?: string
}) {
  const editing = !!initial
  const [text, setText] = useState(initial?.text ?? "")
  const [explanation, setExplanation] = useState(initial?.explanation ?? "")
  const [type, setType] = useState<QuestionType>(initial?.type ?? "MULTIPLE_CHOICE")
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [options, setOptions] = useState<Opt[]>(
    initial?.options ?? [
      { text: "", correct: true },
      { text: "", correct: false },
    ],
  )
  const [saving, setSaving] = useState(false)

  function reset() {
    setText("")
    setExplanation("")
    setType("MULTIPLE_CHOICE")
    setImageUrl(null)
    setOptions([{ text: "", correct: true }, { text: "", correct: false }])
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await api.post<{ url: string }>("/images/questions", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      setImageUrl(res.data.url)
    } catch (err) {
      toast.error(errorMessage(err, "Image upload failed"))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  function changeType(next: QuestionType) {
    setType(next)
    if (next === "TRUE_FALSE") {
      setOptions([{ text: "True", correct: true }, { text: "False", correct: false }])
      return
    }
    if (next === "SINGLE_CHOICE") {
      setOptions((prev) => {
        const firstCorrect = prev.findIndex((o) => o.correct)
        const keep = firstCorrect === -1 ? 0 : firstCorrect
        return prev.map((o, i) => ({ ...o, correct: i === keep }))
      })
    }
  }

  function toggleCorrect(i: number) {
    if (isSingle(type)) setOptions(options.map((o, idx) => ({ ...o, correct: idx === i })))
    else setOptions(options.map((o, idx) => (idx === i ? { ...o, correct: !o.correct } : o)))
  }
  function setOptText(i: number, value: string) {
    setOptions(options.map((o, idx) => (idx === i ? { ...o, text: value } : o)))
  }
  function removeOpt(i: number) {
    setOptions(options.filter((_, idx) => idx !== i))
  }

  async function save() {
    const filled = options.filter((o) => o.text.trim())
    if (filled.length < 2) return toast.error("Add at least two options")
    const correctCount = filled.filter((o) => o.correct).length
    if (correctCount === 0) return toast.error("Mark at least one option as correct")
    if (isSingle(type) && correctCount > 1) return toast.error("This question type allows only one correct answer")
    setSaving(true)
    try {
      await onSave({ text, type, explanation: explanation.trim() || null, imageUrl, options: filled })
      if (!editing) reset()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const tf = type === "TRUE_FALSE"

  return (
    <div className="space-y-5 rounded-xl border border-border bg-card p-5 shadow-sm">
      {/* Question text */}
      <div className="space-y-1.5">
        <Label htmlFor="q-text">Question</Label>
        <Textarea id="q-text" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type the question stem…" />
      </div>

      {/* Optional image */}
      <div className="space-y-1.5">
        <Label>Image <span className="font-normal text-muted-foreground">(optional — for picture-based questions)</span></Label>
        {imageUrl ? (
          <div className="relative w-fit">
            <img src={imageUrl} alt="Question" className="max-h-48 rounded-lg border border-border object-contain" />
            <button
              type="button"
              onClick={() => setImageUrl(null)}
              aria-label="Remove image"
              className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <div>
            <input ref={fileRef} type="file" accept="image/*" onChange={onPickImage} className="hidden" id="q-image" />
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="mr-1 size-4 animate-spin" /> : <ImagePlus className="mr-1 size-4" />}
              {uploading ? "Uploading…" : "Add image"}
            </Button>
          </div>
        )}
      </div>

      {/* Type — segmented control */}
      <div className="space-y-1.5">
        <Label>Answer type</Label>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
          {TYPE_OPTIONS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => changeType(t.value)}
              className={cn(
                "rounded-md px-2 py-2 text-center transition-colors",
                type === t.value ? "bg-card shadow-sm" : "hover:bg-card/50",
              )}
            >
              <div className={cn("font-700 text-xs", type === t.value ? "text-foreground" : "text-muted-foreground")}>{t.label}</div>
              <div className="hidden text-[10px] text-muted-foreground sm:block">{t.hint}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Answer options</Label>
          <span className="text-xs text-muted-foreground">{isSingle(type) ? "Tap the circle to mark the correct one" : "Tap the box for every correct answer"}</span>
        </div>
        <div className="space-y-2">
          {options.map((o, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-2 rounded-lg border p-2 transition-colors",
                o.correct ? "border-success/50 bg-success/5" : "border-border",
              )}
            >
              <span className="font-700 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">{LETTERS[i]}</span>
              <Input
                value={o.text}
                onChange={(e) => setOptText(i, e.target.value)}
                placeholder={`Option ${LETTERS[i]}`}
                disabled={tf}
                className="border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
              <button
                type="button"
                onClick={() => toggleCorrect(i)}
                title="Mark correct"
                className={cn("flex items-center gap-1 rounded-md px-2 py-1 text-xs font-600 transition-colors",
                  o.correct ? "text-success" : "text-muted-foreground hover:text-foreground")}
              >
                {o.correct ? <CheckCircle2 className="size-5" /> : <Circle className="size-5" />}
                <span className="hidden sm:inline">{o.correct ? "Correct" : "Mark"}</span>
              </button>
              {!tf && options.length > 2 && (
                <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => removeOpt(i)} aria-label="Remove option">
                  <X className="size-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        {!tf && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setOptions([...options, { text: "", correct: false }])} disabled={options.length >= 6}>
            <Plus className="mr-1 size-4" /> Add option
          </Button>
        )}
      </div>

      {/* Explanation */}
      <div className="space-y-1.5">
        <Label htmlFor="q-exp">Explanation <span className="font-normal text-muted-foreground">(optional — shown with the answer)</span></Label>
        <Textarea id="q-exp" rows={2} value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Why is this the correct answer?" />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-border pt-4">
        <Button onClick={save} disabled={saving || !text.trim()}>
          {saving && <Loader2 className="mr-2 size-4 animate-spin" />} {submitLabel}
        </Button>
        {onCancel && <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>}
      </div>
    </div>
  )
}
