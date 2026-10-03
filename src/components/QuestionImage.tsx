import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { ImageOff, Loader2, RotateCw } from "lucide-react"
import { cn } from "@/lib/utils"

type Status = "loading" | "loaded" | "error"

/** After this long a still-loading picture gets a "taking longer than usual" hint. */
const SLOW_AFTER_MS = 6000

/**
 * A question picture that tells the student it is on its way: a "Loading image…" placeholder (same
 * footprint every time, so the page does not jump) until the picture has arrived, then the picture itself.
 * A failed load shows a message with a Retry button instead of a blank gap.
 */
export function QuestionImage({
  src, className, wrapperClassName,
}: {
  src: string
  /** Classes for the picture itself (size, border, rounding). */
  className?: string
  /** Classes for the wrapper (margins). */
  wrapperClassName?: string
}) {
  const [status, setStatus] = useState<Status>("loading")
  const [slow, setSlow] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const imgRef = useRef<HTMLImageElement>(null)

  // A different picture means the loader shows again.
  useEffect(() => {
    setStatus("loading")
    setSlow(false)
    setAttempt(0)
  }, [src])

  // A picture already in the browser cache can finish before React attaches onLoad, so check for that too. This runs
  // before the browser paints, so a cached picture never flashes the loader.
  useLayoutEffect(() => {
    const el = imgRef.current
    if (el && el.complete) setStatus(el.naturalWidth > 0 ? "loaded" : "error")
  }, [src, attempt])

  useEffect(() => {
    if (status !== "loading") return
    const t = setTimeout(() => setSlow(true), SLOW_AFTER_MS)
    return () => clearTimeout(t)
  }, [status, src, attempt])

  const loaded = status === "loaded"
  return (
    <div className={cn("relative", wrapperClassName)}>
      {status === "loading" && (
        <div
          role="status"
          aria-live="polite"
          className="flex h-52 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 text-muted-foreground"
        >
          <Loader2 className="size-6 animate-spin text-primary" />
          <span className="text-sm font-600">Loading image…</span>
          {slow && <span className="px-4 text-center text-xs">This is taking longer than usual. Please check your connection.</span>}
        </div>
      )}
      {status === "error" && (
        <div role="alert" className="flex h-52 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-destructive/40 bg-destructive/5 text-muted-foreground">
          <ImageOff className="size-6 text-destructive" />
          <span className="text-sm font-600">The image could not be loaded</span>
          <button
            type="button"
            onClick={() => { setSlow(false); setStatus("loading"); setAttempt((a) => a + 1) }}
            className="font-600 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:bg-muted"
          >
            <RotateCw className="size-3.5" /> Try again
          </button>
        </div>
      )}
      {/* Kept in the page while loading (but invisible) so the browser fetches it. */}
      <img
        key={attempt}
        ref={imgRef}
        src={src}
        alt=""
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        className={loaded ? className : "pointer-events-none absolute size-0 opacity-0"}
      />
    </div>
  )
}

/** Start downloading pictures ahead of time so they are already in the browser when the student gets there. */
export function preloadImages(urls: (string | null | undefined)[]) {
  for (const url of urls) {
    if (!url) continue
    const img = new Image()
    img.src = url
  }
}
