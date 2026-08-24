import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/** Compact page window: 1 … cur-1 cur cur+1 … last (all 1-based). */
function windowOf(current: number, total: number): (number | "…")[] {
  const pages = new Set<number>([1, total, current, current - 1, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const out: (number | "…")[] = []
  let prev = 0
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push("…")
    out.push(p)
    prev = p
  }
  return out
}

/**
 * Zero-based pagination control. Renders nothing for a single page.
 * @param page current page (0-based)
 * @param totalPages total number of pages
 * @param onPage called with the new 0-based page
 */
export function Pagination({
  page,
  totalPages,
  onPage,
  className,
}: {
  page: number
  totalPages: number
  onPage: (page: number) => void
  className?: string
}) {
  if (totalPages <= 1) return null
  const cur = page + 1
  return (
    <div className={cn("mt-6 flex items-center justify-center gap-1", className)}>
      <Button variant="outline" size="sm" onClick={() => onPage(page - 1)} disabled={page <= 0}>
        <ChevronLeft className="size-4" />
      </Button>
      {windowOf(cur, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1.5 text-muted-foreground">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p - 1)}
            className={cn(
              "tabular size-8 rounded-md text-sm font-600 transition-colors",
              p === cur ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {p}
          </button>
        ),
      )}
      <Button variant="outline" size="sm" onClick={() => onPage(page + 1)} disabled={cur >= totalPages}>
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
