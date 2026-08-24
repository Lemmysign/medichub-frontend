import { useState } from "react"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { CommentResponse, PagedResponse } from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState, EmptyState } from "@/components/common"
import { Pagination } from "@/components/ui/pagination"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { BookOpen, CheckCircle2, CornerDownRight, Loader2, Send } from "lucide-react"

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return "just now"
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return new Date(iso).toLocaleDateString()
}

export function InstructorQuestionsPage() {
  const [unansweredOnly, setUnansweredOnly] = useState(false)
  const [page, setPage] = useState(0)
  const { data, loading, error, reload } = useApi(
    () =>
      api
        .get<PagedResponse<CommentResponse>>("/instructor/questions", { params: { unansweredOnly, page, size: 20 } })
        .then((r) => r.data),
    [unansweredOnly, page],
  )

  return (
    <>
      <PageHeader
        title="Q&A Inbox"
        description="Student questions across your courses — answer to help them progress"
        action={
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            <button
              onClick={() => { setUnansweredOnly(false); setPage(0) }}
              className={"font-500 rounded-md px-3 py-1.5 text-sm transition-colors " + (!unansweredOnly ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              All
            </button>
            <button
              onClick={() => { setUnansweredOnly(true); setPage(0) }}
              className={"font-500 rounded-md px-3 py-1.5 text-sm transition-colors " + (unansweredOnly ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              Unanswered
            </button>
          </div>
        }
      />
      {loading ? <CenteredSpinner /> : error ? <ErrorState message={error} /> : !data || data.content.length === 0 ? (
        <EmptyState title="No questions" description={unansweredOnly ? "No unanswered questions — you're all caught up." : "Student questions will appear here."} />
      ) : (
        <>
          <div className="space-y-4">
            {data.content.map((q) => (
              <QuestionCard key={q.id} q={q} onReplied={reload} />
            ))}
          </div>
          {data && <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />}
        </>
      )}
    </>
  )
}

function QuestionCard({ q, onReplied }: { q: CommentResponse; onReplied: () => void }) {
  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)
  const [open, setOpen] = useState(false)

  async function send() {
    setSending(true)
    try {
      await api.post(`/instructor/courses/${q.courseId}/comments/${q.id}/reply`, { text: reply })
      toast.success("Reply sent")
      setReply("")
      setOpen(false)
      onReplied()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className="overflow-hidden p-0">
      {/* Course tag strip */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-5 py-2.5 text-xs">
        <span className="font-700 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-primary">
          <BookOpen className="size-3.5" /> {q.courseTitle ?? "Course"}
        </span>
        {q.topicTitle && <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">{q.topicTitle}</span>}
        <span className="ml-auto">
          {q.answered ? (
            <span className="font-600 inline-flex items-center gap-1 text-success"><CheckCircle2 className="size-3.5" /> Answered</span>
          ) : (
            <span className="font-600 inline-flex items-center gap-1 text-destructive"><span className="size-1.5 rounded-full bg-destructive" /> Needs reply</span>
          )}
        </span>
      </div>

      <div className="p-5">
        {/* Asker */}
        <div className="flex items-center gap-3">
          <div className="font-700 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
            {initials(q.authorName)}
          </div>
          <div className="min-w-0">
            <div className="font-600 text-sm">{q.authorName}</div>
            <div className="text-xs text-muted-foreground">{q.authorRole.toLowerCase()} · {timeAgo(q.createdAt)}</div>
          </div>
        </div>

        {/* Question */}
        <p className="mt-3 leading-relaxed">{q.text}</p>

        {/* Replies */}
        {q.replies.length > 0 && (
          <div className="mt-4 space-y-3 border-l-2 border-primary/30 pl-4">
            {q.replies.map((r) => (
              <div key={r.id} className="flex gap-3">
                <div className="font-700 flex size-7 shrink-0 items-center justify-center rounded-full bg-success/15 text-[10px] text-success">
                  {initials(r.authorName)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs">
                    <span className="font-600">{r.authorName}</span>{" "}
                    <span className="text-muted-foreground">· {r.authorRole.toLowerCase()} · {timeAgo(r.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-foreground/90">{r.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Composer */}
        {open ? (
          <div className="mt-4 space-y-2">
            <Textarea rows={3} autoFocus placeholder="Write your answer…" value={reply} onChange={(e) => setReply(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setOpen(false); setReply("") }} disabled={sending}>Cancel</Button>
              <Button size="sm" onClick={send} disabled={sending || !reply.trim()}>
                {sending ? <Loader2 className="mr-1 size-4 animate-spin" /> : <Send className="mr-1 size-4" />} Send reply
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="font-600 mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <CornerDownRight className="size-4" /> {q.answered ? "Add another reply" : "Reply"}
          </button>
        )}
      </div>
    </Card>
  )
}
