import * as XLSX from "xlsx"
import type { QuestionType } from "@/lib/types"

/** One question ready to POST, matching the backend CreateQuestionRequest. */
export interface ParsedQuestion {
  text: string
  type: QuestionType
  explanation: string | null
  options: { text: string; correct: boolean }[]
}

export interface ParsedRow {
  /** 1-based row number as it appears in the spreadsheet (header excluded). */
  row: number
  question: ParsedQuestion
  errors: string[]
}

export interface ParseResult {
  rows: ParsedRow[]
  validCount: number
  errorCount: number
}

const MAX_OPTION_COLUMNS = 10

function normalizeType(raw: string): QuestionType {
  const t = raw.trim().toLowerCase().replace(/[\s-]+/g, "_")
  if (["single_choice", "single", "sc"].includes(t)) return "SINGLE_CHOICE"
  if (["true_false", "true/false", "truefalse", "tf", "boolean", "bool"].includes(t)) return "TRUE_FALSE"
  return "MULTIPLE_CHOICE" // default (includes blank / "multiple_choice" / "mc")
}

function isTruthy(raw: unknown): boolean {
  return ["true", "t", "yes", "y", "1", "x", "correct"].includes(String(raw ?? "").trim().toLowerCase())
}

const isSingle = (t: QuestionType) => t === "SINGLE_CHOICE" || t === "TRUE_FALSE"

/** Lower-cases and trims every header key so the template is case-insensitive. */
function normalizeKeys(obj: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj)) {
    out[k.trim().toLowerCase()] = v == null ? "" : String(v).trim()
  }
  return out
}

function validate(q: ParsedQuestion): string[] {
  const errors: string[] = []
  if (!q.text) errors.push("Question text is required")
  if (q.text.length > 2000) errors.push("Question text exceeds 2000 characters")
  if (q.options.length < 2) errors.push("At least two options are required")
  if (q.options.length > 10) errors.push("At most ten options are allowed")
  const correct = q.options.filter((o) => o.correct).length
  if (correct === 0) errors.push("Mark at least one option as correct")
  if (isSingle(q.type) && correct > 1) {
    errors.push(q.type === "TRUE_FALSE" ? "True/False allows only one correct option" : "Single-choice allows only one correct option")
  }
  return errors
}

function toQuestion(rowObj: Record<string, string>): ParsedQuestion {
  const type = normalizeType(rowObj["type"] ?? "")
  const options: { text: string; correct: boolean }[] = []
  for (let n = 1; n <= MAX_OPTION_COLUMNS; n++) {
    const text = (rowObj[`option${n}`] ?? "").trim()
    if (!text) continue
    options.push({ text, correct: isTruthy(rowObj[`correct${n}`]) })
  }
  const explanation = (rowObj["explanation"] ?? "").trim()
  return { text: (rowObj["text"] ?? "").trim(), type, explanation: explanation || null, options }
}

/** Read an .xlsx or .csv file into validated question rows. */
export async function parseQuestionFile(file: File): Promise<ParseResult> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: "array" })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })

  const rows: ParsedRow[] = []
  raw.forEach((r, i) => {
    const obj = normalizeKeys(r)
    // Skip fully blank rows.
    if (Object.values(obj).every((v) => v === "")) return
    const question = toQuestion(obj)
    rows.push({ row: i + 2, question, errors: validate(question) }) // +2: header row + 1-based
  })

  const errorCount = rows.filter((r) => r.errors.length > 0).length
  return { rows, validCount: rows.length - errorCount, errorCount }
}

/** Build and download a starter .xlsx template with the expected columns + an example. */
export function downloadTemplate() {
  const header = [
    "text", "type", "explanation",
    "option1", "correct1", "option2", "correct2", "option3", "correct3", "option4", "correct4",
  ]
  const examples = [
    ["What is the capital of France?", "SINGLE_CHOICE", "Paris is the capital of France.",
      "Paris", "TRUE", "Rome", "FALSE", "Lagos", "FALSE", "Berlin", "FALSE"],
    ["Which are signs of inflammation?", "MULTIPLE_CHOICE", "Calor, rubor, tumor, dolor.",
      "Redness", "TRUE", "Heat", "TRUE", "Numbness", "FALSE", "Pallor", "FALSE"],
    ["The heart has four chambers.", "TRUE_FALSE", "Two atria and two ventricles.",
      "True", "TRUE", "False", "FALSE", "", "", "", ""],
  ]
  const ws = XLSX.utils.aoa_to_sheet([header, ...examples])
  ws["!cols"] = [{ wch: 40 }, { wch: 16 }, { wch: 36 }, ...Array(8).fill({ wch: 14 })]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Questions")
  XLSX.writeFile(wb, "medichub-questions-template.xlsx")
}
