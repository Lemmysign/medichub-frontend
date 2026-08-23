import { useState } from "react"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { CommentResponse, PagedResponse } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/common"

export function CourseDiscussion({ courseId }: { courseId: number }) {
  const { data, loading, reload } = useApi(
    () =>
      api
        .get<PagedResponse<CommentResponse>>(`/student/courses/${courseId}/comments`, { params: { size: 30 } })
        .then((r) => r.data)
        .catch(() => null),
    [courseId],
  )
  const [text, setText] = useState("")
  const [posting, setPosting] = useState(false)

  async function ask() {
    if (!text.trim()) return
    setPosting(true)
    try {
      await api.post(`/student/courses/${courseId}/comments`, { text })
      setText("")
      toast.success("Question posted")
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setPosting(false)
    }
  }

  return (
    <div>
      <h3 className="mb-2 font-medium">Discussion & questions</h3>
      <Card className="p-4">
        <div className="flex gap-2">
          <Textarea rows={2} placeholder="Ask the instructor a question…" value={text} onChange={(e) => setText(e.target.value)} />
          <Button onClick={ask} disabled={posting || !text.trim()}>Ask</Button>
        </div>
      </Card>

      {loading ? (
        <div className="mt-4"><Spinner /></div>
      ) : data && data.content.length > 0 ? (
        <div className="mt-4 space-y-3">
          {data.content.map((c) => (
            <Card key={c.id} className="p-4">
              <p className="text-sm font-medium">{c.authorName}</p>
              <p className="mt-1 text-sm">{c.text}</p>
              {c.replies.length > 0 && (
                <div className="mt-3 space-y-2 border-l-2 border-primary/30 pl-4">
                  {c.replies.map((r) => (
                    <div key={r.id} className="text-sm">
                      <span className="font-medium">{r.authorName}</span>{" "}
                      <span className="text-xs text-muted-foreground">({r.authorRole.toLowerCase()})</span>
                      <p>{r.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">No questions yet — be the first to ask.</p>
      )}
    </div>
  )
}
