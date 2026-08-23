import { useEffect, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type {
  CoursePreviewResponse,
  CourseProgressResponse,
  MaterialResponse,
  VideoPlaybackResponse,
} from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState } from "@/components/common"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Circle, Download, FileText, Loader2, Lock, PlayCircle } from "lucide-react"

const WATCH_THRESHOLD = 30

export function CoursePlayerPage() {
  const { id } = useParams()
  const courseId = Number(id)
  const preview = useApi(() => api.get<CoursePreviewResponse>(`/public/courses/${courseId}`).then((r) => r.data), [courseId])

  const [progress, setProgress] = useState<CourseProgressResponse | null>(null)
  const [completed, setCompleted] = useState<Set<number>>(new Set())
  const [activeTopic, setActiveTopic] = useState<number | null>(null)
  const [playback, setPlayback] = useState<VideoPlaybackResponse | null>(null)
  const [playbackError, setPlaybackError] = useState<string | null>(null)
  const [loadingPlayback, setLoadingPlayback] = useState(false)
  const [materials, setMaterials] = useState<MaterialResponse[]>([])
  const [gated, setGated] = useState(false)
  const watchSeconds = useRef(0)

  // Open the course (idempotent enroll) + load progress and materials.
  useEffect(() => {
    api
      .post<CourseProgressResponse>(`/student/courses/${courseId}/open`)
      .then((r) => setProgress(r.data))
      .catch((e) => {
        if (e?.response?.status === 402) setGated(true)
        else toast.error(errorMessage(e))
      })
    api
      .get<MaterialResponse[]>(`/student/courses/${courseId}/materials`)
      .then((r) => setMaterials(r.data))
      .catch(() => {})
  }, [courseId])

  // Watch timer: while a topic is active, accumulate seconds; mark complete at threshold.
  useEffect(() => {
    if (activeTopic == null || !playback) return
    watchSeconds.current = 0
    const timer = setInterval(() => {
      watchSeconds.current += 5
      if (watchSeconds.current >= WATCH_THRESHOLD) {
        clearInterval(timer)
        markWatched(activeTopic, watchSeconds.current)
      }
    }, 5000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTopic, playback])

  async function markWatched(topicId: number, seconds: number) {
    try {
      const res = await api.post(`/student/courses/${courseId}/topics/${topicId}/progress`, { secondsWatched: seconds })
      if (res.data.completed) {
        setCompleted((prev) => new Set(prev).add(topicId))
        toast.success("Topic completed")
        const p = await api.get<CourseProgressResponse>(`/student/courses/${courseId}/progress`)
        setProgress(p.data)
      }
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  async function openTopic(topicId: number) {
    setActiveTopic(topicId)
    setPlayback(null)
    setPlaybackError(null)
    setLoadingPlayback(true)
    try {
      const res = await api.get<VideoPlaybackResponse>(`/student/courses/${courseId}/topics/${topicId}/playback`)
      setPlayback(res.data)
    } catch (e) {
      const err = e as { response?: { status?: number } }
      if (err.response?.status === 402) {
        setGated(true)
        setPlaybackError("An active subscription is required to watch this video.")
      } else if (err.response?.status === 404) {
        setPlaybackError("No video has been uploaded for this topic yet.")
      } else {
        setPlaybackError(errorMessage(e))
      }
    } finally {
      setLoadingPlayback(false)
    }
  }

  async function downloadMaterial(materialId: number) {
    try {
      const res = await api.get<{ url: string }>(`/student/courses/${courseId}/materials/${materialId}/download`)
      window.open(res.data.url, "_blank")
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  if (preview.loading) return <CenteredSpinner />
  if (preview.error) return <ErrorState message={preview.error} />
  const course = preview.data!

  return (
    <>
      <PageHeader
        title={course.title}
        description={course.instructorName}
        action={
          <Button asChild variant="outline">
            <Link to="/student/courses">Back to my courses</Link>
          </Button>
        }
      />

      {gated && (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-primary" />
            <span className="text-sm">An active subscription is required to watch videos and download materials.</span>
          </div>
          <Button asChild size="sm">
            <Link to="/student/subscription">Subscribe</Link>
          </Button>
        </Card>
      )}

      {progress && (
        <div className="mb-6 flex items-center gap-3">
          <Progress value={progress.percentComplete} className="max-w-xs" />
          <span className="text-sm text-muted-foreground">
            {progress.completedTopics}/{progress.totalTopics} topics • {progress.percentComplete}%
          </span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <Card className="flex aspect-video items-center justify-center bg-black/90 text-white">
            {loadingPlayback ? (
              <Loader2 className="size-8 animate-spin" />
            ) : playback ? (
              <video key={playback.topicId} className="size-full rounded-md" controls src={playback.playbackUrl}>
                Your browser cannot play this video.
              </video>
            ) : playbackError ? (
              <p className="px-6 text-center text-sm text-white/70">{playbackError}</p>
            ) : (
              <p className="px-6 text-center text-sm text-white/60">Select a topic to start watching.</p>
            )}
          </Card>
          {playback?.downloadEnabled && playback.downloadUrl && (
            <Button asChild variant="outline" size="sm" className="mt-3">
              <a href={playback.downloadUrl} target="_blank" rel="noreferrer">
                <Download className="mr-2 size-4" /> Download video
              </a>
            </Button>
          )}

          {materials.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 font-medium">Course materials</h3>
              <Card className="divide-y p-0">
                {materials.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                    <FileText className="size-4 text-muted-foreground" />
                    <span className="flex-1 text-sm">{m.fileName}</span>
                    <Button size="sm" variant="ghost" onClick={() => downloadMaterial(m.id)}>
                      <Download className="size-4" />
                    </Button>
                  </div>
                ))}
              </Card>
            </div>
          )}
        </div>

        <Card className="h-fit p-0">
          <div className="border-b px-4 py-3 font-medium">Topics</div>
          <div className="divide-y">
            {course.topics.map((t, i) => {
              const done = completed.has(t.id)
              const active = activeTopic === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => openTopic(t.id)}
                  className={
                    "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted " +
                    (active ? "bg-primary/5" : "")
                  }
                >
                  {done ? (
                    <CheckCircle2 className="size-4 shrink-0 text-success" />
                  ) : t.hasVideo ? (
                    <PlayCircle className="size-4 shrink-0 text-primary" />
                  ) : (
                    <Circle className="size-4 shrink-0 text-muted-foreground/40" />
                  )}
                  <span className="w-5 text-muted-foreground">{i + 1}</span>
                  <span className="flex-1">{t.title}</span>
                </button>
              )
            })}
            {course.topics.length === 0 && <div className="px-4 py-6 text-sm text-muted-foreground">No topics yet.</div>}
          </div>
        </Card>
      </div>
    </>
  )
}
