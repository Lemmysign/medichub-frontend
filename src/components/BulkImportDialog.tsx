import { useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import {
  parseQuestionFile, downloadTemplate, downloadPictureTemplate, findImageFile, isImageUrl,
  type ParseResult, type ParsedRow,
} from "@/lib/bulkQuestions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Download, Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, X, Image as ImageIcon } from "lucide-react"

type Mode = "text" | "pictures"

/**
 * Bulk-import questions from an .xlsx/.csv file. Parses in the browser, previews with
 * per-row validation, and POSTs the valid rows to {@link endpoint} as {@code { questions: [...] }}.
 *
 * Supports two modes: plain text questions, or "with pictures" — the spreadsheet's `imageUrl`
 * column then holds a bare filename (e.g. "q1.jpg"); the instructor also selects the matching
 * image files, each of which is uploaded to Cloudinary automatically before the batch is sent.
 */
export function BulkImportDialog({ endpoint, onImported }: { endpoint: string; onImported: () => void }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>("text")
  const [fileName, setFileName] = useState<string | null>(null)
  const [result, setResult] = useState<ParseResult | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const imagesRef = useRef<HTMLInputElement>(null)

  function reset() {
    setFileName(null)
    setResult(null)
    setImageFiles([])
    setMode("text")
    if (inputRef.current) inputRef.current.value = ""
    if (imagesRef.current) imagesRef.current.value = ""
  }

  function changeMode(next: Mode) {
    setMode(next)
    setResult(null)
    setFileName(null)
    setImageFiles([])
    if (inputRef.current) inputRef.current.value = ""
    if (imagesRef.current) imagesRef.current.value = ""
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setParsing(true)
    try {
      setResult(await parseQuestionFile(file))
    } catch {
      toast.error("Couldn't read that file. Use the template (.xlsx or .csv).")
      reset()
    } finally {
      setParsing(false)
    }
  }

  function onPickImages(e: React.ChangeEvent<HTMLInputElement>) {
    setImageFiles(Array.from(e.target.files ?? []))
  }

  /** Rows with picture-mode validation layered on (an unmatched image reference is an error). */
  const rows: ParsedRow[] = useMemo(() => {
    if (!result) return []
    if (mode !== "pictures") return result.rows
    return result.rows.map((r) => {
      const ref = r.question.imageUrl
      if (!ref || isImageUrl(ref)) return r
      if (findImageFile(ref, imageFiles)) return r
      return { ...r, errors: [...r.errors, `Image "${ref}" not found among selected files`] }
    })
  }, [result, mode, imageFiles])

  const validCount = rows.filter((r) => r.errors.length === 0).length
  const errorCount = rows.length - validCount

  async function doImport() {
    const validRows = rows.filter((r) => r.errors.length === 0)
    if (validRows.length === 0) {
      toast.error("No valid questions to import")
      return
    }
    setImporting(true)
    try {
      const pending = mode === "pictures"
        ? validRows.filter((r) => r.question.imageUrl && !isImageUrl(r.question.imageUrl))
        : []
      if (pending.length > 0) setProgress({ done: 0, total: pending.length })

      const questions = []
      let done = 0
      for (const r of validRows) {
        let q = r.question
        if (mode === "pictures" && q.imageUrl && !isImageUrl(q.imageUrl)) {
          const file = findImageFile(q.imageUrl, imageFiles)!
          const fd = new FormData()
          fd.append("file", file)
          const res = await api.post<{ url: string }>("/images/questions", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          })
          q = { ...q, imageUrl: res.data.url }
          done++
          setProgress({ done, total: pending.length })
        }
        questions.push(q)
      }

      await api.post(endpoint, { questions })
      toast.success(`Imported ${questions.length} question${questions.length === 1 ? "" : "s"}`)
      setOpen(false)
      reset()
      onImported()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setImporting(false)
      setProgress(null)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Upload className="mr-1 size-4" /> Import
      </Button>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset() }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Import questions</DialogTitle></DialogHeader>

          <div className="space-y-4">
            {/* Mode toggle */}
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
              <button
                type="button"
                onClick={() => changeMode("text")}
                className={"rounded-md px-3 py-2 text-sm font-600 transition-colors " + (mode === "text" ? "bg-card shadow-sm" : "text-muted-foreground hover:bg-card/50")}
              >
                Text only
              </button>
              <button
                type="button"
                onClick={() => changeMode("pictures")}
                className={"flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-600 transition-colors " + (mode === "pictures" ? "bg-card shadow-sm" : "text-muted-foreground hover:bg-card/50")}
              >
                <ImageIcon className="size-4" /> With pictures
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <FileSpreadsheet className="size-5 shrink-0 text-primary" />
              <p className="flex-1 text-muted-foreground">
                {mode === "text"
                  ? "Upload an Excel (.xlsx) or CSV file. Start from the template so the columns line up."
                  : "The imageUrl column holds each question's picture filename (e.g. q1.jpg) — select the matching image files below."}
              </p>
              <Button variant="secondary" size="sm" onClick={mode === "text" ? downloadTemplate : downloadPictureTemplate}>
                <Download className="mr-1 size-4" /> Template
              </Button>
            </div>

            <div>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={onFile}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-600 file:text-primary-foreground hover:file:opacity-90"
              />
              {fileName && <p className="mt-2 text-xs text-muted-foreground">{fileName}</p>}
            </div>

            {mode === "pictures" && (
              <div>
                <label className="mb-1.5 block text-xs font-600 text-muted-foreground">Image files (select all referenced pictures at once)</label>
                <input
                  ref={imagesRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onPickImages}
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-600 file:text-secondary-foreground hover:file:opacity-90"
                />
                {imageFiles.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">{imageFiles.length} image{imageFiles.length === 1 ? "" : "s"} selected</p>
                )}
              </div>
            )}

            {parsing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Reading file…
              </div>
            )}

            {result && (
              <>
                <div className="flex items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-1 text-success">
                    <CheckCircle2 className="size-4" /> {validCount} ready
                  </span>
                  {errorCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-destructive">
                      <AlertCircle className="size-4" /> {errorCount} with errors
                    </span>
                  )}
                </div>

                <div className="max-h-72 overflow-auto rounded-lg border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-muted/70">
                      <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:font-700 [&>th]:text-muted-foreground">
                        <th className="w-10">#</th>
                        <th>Question</th>
                        <th className="w-28">Type</th>
                        <th className="w-16">Opts</th>
                        <th className="w-44">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => {
                        const ok = r.errors.length === 0
                        return (
                          <tr key={r.row} className="border-t border-border align-top [&>td]:px-3 [&>td]:py-2">
                            <td className="tabular text-muted-foreground">{r.row}</td>
                            <td className="max-w-xs truncate">{r.question.text || <span className="text-muted-foreground italic">（blank）</span>}</td>
                            <td className="text-muted-foreground">{r.question.type.replace("_", " ").toLowerCase()}</td>
                            <td className="tabular text-muted-foreground">{r.question.options.length}</td>
                            <td>
                              {ok ? (
                                <Badge className="bg-success text-success-foreground">Ready</Badge>
                              ) : (
                                <span className="flex items-center gap-1 text-destructive">
                                  <X className="size-3 shrink-0" /> {r.errors[0]}
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {errorCount > 0 && (
                  <p className="text-xs text-muted-foreground">Rows with errors are skipped; fix them {mode === "pictures" ? "(or select the missing image files) " : ""}and re-upload to include them.</p>
                )}
              </>
            )}

            {progress && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Uploading images… {progress.done}/{progress.total}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => { setOpen(false); reset() }} disabled={importing}>Cancel</Button>
            <Button onClick={doImport} disabled={importing || !result || validCount === 0}>
              {importing && <Loader2 className="mr-2 size-4 animate-spin" />}
              Import {validCount} question{validCount === 1 ? "" : "s"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
