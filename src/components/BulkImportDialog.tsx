import { useRef, useState } from "react"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { parseQuestionFile, downloadTemplate, type ParseResult } from "@/lib/bulkQuestions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Download, Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react"

/**
 * Bulk-import questions from an .xlsx/.csv file. Parses in the browser, previews with
 * per-row validation, and POSTs the valid rows to {@link endpoint} as {@code { questions: [...] }}.
 */
export function BulkImportDialog({ endpoint, onImported }: { endpoint: string; onImported: () => void }) {
  const [open, setOpen] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [result, setResult] = useState<ParseResult | null>(null)
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setFileName(null)
    setResult(null)
    if (inputRef.current) inputRef.current.value = ""
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

  async function doImport() {
    if (!result) return
    const questions = result.rows.filter((r) => r.errors.length === 0).map((r) => r.question)
    if (questions.length === 0) {
      toast.error("No valid questions to import")
      return
    }
    setImporting(true)
    try {
      await api.post(endpoint, { questions })
      toast.success(`Imported ${questions.length} question${questions.length === 1 ? "" : "s"}`)
      setOpen(false)
      reset()
      onImported()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setImporting(false)
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
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <FileSpreadsheet className="size-5 shrink-0 text-primary" />
              <p className="flex-1 text-muted-foreground">
                Upload an Excel (.xlsx) or CSV file. Start from the template so the columns line up.
              </p>
              <Button variant="secondary" size="sm" onClick={downloadTemplate}>
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

            {parsing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Reading file…
              </div>
            )}

            {result && (
              <>
                <div className="flex items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-1 text-success">
                    <CheckCircle2 className="size-4" /> {result.validCount} ready
                  </span>
                  {result.errorCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-destructive">
                      <AlertCircle className="size-4" /> {result.errorCount} with errors
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
                        <th className="w-40">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((r) => {
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
                {result.errorCount > 0 && (
                  <p className="text-xs text-muted-foreground">Rows with errors are skipped; fix them in the file and re-upload to include them.</p>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => { setOpen(false); reset() }} disabled={importing}>Cancel</Button>
            <Button onClick={doImport} disabled={importing || !result || result.validCount === 0}>
              {importing && <Loader2 className="mr-2 size-4 animate-spin" />}
              Import {result ? result.validCount : 0} question{result?.validCount === 1 ? "" : "s"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
