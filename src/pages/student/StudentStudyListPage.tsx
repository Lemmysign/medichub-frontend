import { Link } from "react-router-dom"
import { useState } from "react"
import { api } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import { useSubjects } from "@/hooks/useSubjects"
import type { PagedResponse, StudyMaterialResponse } from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState, EmptyState } from "@/components/common"
import { SubjectFilter } from "@/pages/mock/MockExamsListPage"
import { Pagination } from "@/components/ui/pagination"
import { ChevronRight, FileText, Tag } from "lucide-react"

export function StudentStudyListPage() {
  const subjects = useSubjects()
  const [subjectId, setSubjectId] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const { data, loading, error } = useApi(
    () => api.get<PagedResponse<StudyMaterialResponse>>("/student/study", { params: { page, size: 12, subjectId: subjectId ?? undefined } }).then((r) => r.data),
    [page, subjectId],
  )
  const docs = data?.content ?? []

  return (
    <>
      <PageHeader title="Study" description="Read notes and study material uploaded by your instructors — right in the browser." />

      <SubjectFilter subjects={subjects.data ?? []} value={subjectId} onChange={(v) => { setSubjectId(v); setPage(0) }} />

      {loading ? <CenteredSpinner /> : error ? <ErrorState message={error} /> : docs.length === 0 ? (
        <EmptyState title="No study material yet" description="Notes and documents from your instructors will appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((d) => (
            <Link
              key={d.id}
              to={`${d.id}`}
              state={{ title: d.title, contentType: d.contentType }}
              className="group flex flex-col rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText className="size-[17px]" /></span>
                {d.subjectName && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-600 text-accent-foreground">
                    <Tag className="size-3" /> {d.subjectName}
                  </span>
                )}
              </div>
              <h3 className="font-800 mt-3 line-clamp-2 leading-snug tracking-tight transition-colors group-hover:text-primary">{d.title}</h3>
              {d.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{d.description}</p>}
              <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3">
                <span className="truncate text-xs text-muted-foreground">{d.fileName}</span>
                <span className="font-600 flex items-center gap-0.5 text-xs text-primary">Read <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span>
              </div>
            </Link>
          ))}
        </div>
      )}
      {data && <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />}
    </>
  )
}
