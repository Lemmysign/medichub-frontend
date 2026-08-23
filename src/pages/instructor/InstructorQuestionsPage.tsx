import { useState } from "react"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { CommentResponse, PagedResponse } from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState, EmptyState } from "@/components/common"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

export function InstructorQuestionsPage() {
  const [unansweredOnly, setUnansweredOnly] = useState(false)
  const { data, loading, error, reload } = useApi(
    () =>
      api
        .get<PagedResponse<CommentResponse>>("/instructor/questions", { params: { unansweredOnly, size: 50 } })
        .then((r) => r.data),
    [unansweredOnly],
  )

  return (
    <>
      <PageHeader
        title="Student questions"
        description="Answer questions across your courses"
        action={
          <Button variant={unansweredOnly ? "default" : "outline"} onClick={() => setUnansweredOnly((v) => !v)}>
            {unansweredOnly ? "Showing unanswered" : "Show unanswered only"}
          </Button>
        }
      />
      {loading ? <CenteredSpinner /> : error ? <ErrorState message={error} /> : !data || data.content.length === 0 ? (
        <EmptyState title="No questions" description="Student questions will appear here." />
      ) : (
        <div className="space-y-4">
          {data.content.map((q) => (
            <QuestionCard key={q.id} q={q} onReplied={reload} />
          ))}
        </div>
      )}
    </>
  )
}

function QuestionCard({ q, onReplied }: { q: CommentResponse; onReplied: () => void }) {
  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)

  async function send() {
    setSending(true)
    try {
      await api.post(`/instructor/courses/${q.courseId}/comments/${q.id}/reply`, { text: reply })
      toast.success("Reply sent")
      setReply("")
      onReplied()
    } catch (e) { toast.error(errorMessage(e)) } finally { setSending(false) }
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{q.authorName}</p>
        <Badge variant={q.answered ? "secondary" : "default"}>{q.answered ? "Answered" : "Unanswered"}</Badge>
      </div>
      <p className="mt-2">{q.text}</p>
      {q.replies.length > 0 && (
        <div className="mt-3 space-y-2 border-l-2 border-primary/30 pl-4">
          {q.replies.map((r) => (
            <div key={r.id} className="text-sm">
              <span className="font-medium">{r.authorName}</span>{" "}
              <span className="text-muted-foreground">({r.authorRole.toLowerCase()})</span>
              <p>{r.text}</p>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 flex gap-2">
        <Textarea rows={2} placeholder="Write a reply…" value={reply} onChange={(e) => setReply(e.target.value)} />
        <Button onClick={send} disabled={sending || !reply.trim()}>Reply</Button>
      </div>
    </Card>
  )
}
