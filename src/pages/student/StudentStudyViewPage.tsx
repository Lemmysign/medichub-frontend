import { useEffect, useState } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { api, errorMessage } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { DownloadUrlResponse } from "@/lib/types"
import { CenteredSpinner, ErrorState } from "@/components/common"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react"

type Kind = "pdf" | "docx" | "other"

function fileKind(contentType: string | null | undefined, url: string): Kind {
  const ct = (contentType ?? "").toLowerCase()
  if (ct.includes("pdf")) return "pdf"
  if (ct.includes("word") || ct.includes("wordprocessing")) return "docx"
  const clean = url.split("?")[0].toLowerCase()
  if (clean.endsWith(".pdf")) return "pdf"
  if (clean.endsWith(".docx")) return "docx"
  return "other"
}

export function StudentStudyViewPage() {
  const { id } = useParams()
  const location = useLocation()
  const nav = (location.state as { title?: string; contentType?: string | null } | null) ?? null
  const title = nav?.title ?? "Study document"

  const { data, loading, error } = useApi(
    () => api.get<DownloadUrlResponse>(`/student/study/${id}/view`).then((r) => r.data),
    [id],
  )

  const [docHtml, setDocHtml] = useState<string | null>(null)
  const [docLoading, setDocLoading] = useState(false)
  const [docError, setDocError] = useState<string | null>(null)

  const url = data?.url
  const kind = url ? fileKind(nav?.contentType, url) : "other"

  useEffect(() => {
    if (!url || kind !== "docx") return
    let cancelled = false
    setDocLoading(true); setDocError(null)
    ;(async () => {
      try {
        const mammoth = (await import("mammoth")).default
        const res = await fetch(url)
        const buf = await res.arrayBuffer()
        const out = await mammoth.convertToHtml({ arrayBuffer: buf })
        if (!cancelled) setDocHtml(out.value)
      } catch (e) {
        if (!cancelled) setDocError(errorMessage(e, "Couldn't render this document"))
      } finally {
        if (!cancelled) setDocLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [url, kind])

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link to="/student/study" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Study
        </Link>
        {url && (
          <Button asChild variant="outline" size="sm">
            <a href={url} target="_blank" rel="noreferrer"><ExternalLink className="mr-1 size-4" /> Open in new tab</a>
          </Button>
        )}
      </div>

      <h1 className="font-800 mb-4 text-2xl tracking-tight">{title}</h1>

      {loading ? <CenteredSpinner /> : error ? <ErrorState message={error} /> : !url ? (
        <ErrorState message="Document unavailable" />
      ) : kind === "pdf" ? (
        <iframe title={title} src={url} className="h-[80vh] w-full rounded-lg border border-border" />
      ) : kind === "docx" ? (
        docLoading ? (
          <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Rendering document…
          </div>
        ) : docError ? (
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">This document couldn't be rendered inline.</p>
            <Button asChild className="mt-3"><a href={url} target="_blank" rel="noreferrer">Open the document</a></Button>
          </div>
        ) : (
          <div
            className="prose prose-sm max-w-none rounded-lg border border-border bg-card p-6 md:p-8 [&_h1]:font-800 [&_h2]:font-700 [&_p]:my-2 [&_table]:w-full [&_td]:border [&_td]:border-border [&_td]:p-2"
            dangerouslySetInnerHTML={{ __html: docHtml ?? "" }}
          />
        )
      ) : (
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">This file type can't be previewed inline.</p>
          <Button asChild className="mt-3"><a href={url} target="_blank" rel="noreferrer">Open the document</a></Button>
        </div>
      )}
    </div>
  )
}
