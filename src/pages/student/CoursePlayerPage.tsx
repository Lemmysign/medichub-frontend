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
import { CenteredSpinner, ErrorState } from "@/components/common"
import { CourseTests } from "@/components/CourseTests"
import { CourseDiscussion } from "@/components/CourseDiscussion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, Circle, Download, Loader2, Lock, Play, PlayCircle, ChevronLeft } from "lucide-react"

const WATCH_THRESHOLD = 30

function mmss(seconds: number | null) {
  if (!seconds) return ""
  const m = Math.floor(seconds / 60), s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

function fileSize(bytes: number | null) {
  if (!bytes) return ""
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

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
  const [tab, setTab] = useState("topics")
  const watchSeconds = useRef(0)

  useEffect(() => {
    api.post<CourseProgressResponse>(`/student/courses/${courseId}/open`)
      .then((r) => setProgress(r.data))
      .catch((e) => { if (e?.response?.status === 402) setGated(true); else toast.error(errorMessage(e)) })
    api.get<MaterialResponse[]>(`/student/courses/${courseId}/materials`)
      .then((r) => setMaterials(r.data)).catch(() => {})
  }, [courseId])

  useEffect(() => {
    if (activeTopic == null || !playback) return
    watchSeconds.current = 0
    const timer = setInterval(() => {
      watchSeconds.current += 5
      if (watchSeconds.current >= WATCH_THRESHOLD) { clearInterval(timer); markWatched(activeTopic, watchSeconds.current) }
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
    setActiveTopic(topicId); setPlayback(null); setPlaybackError(null); setLoadingPlayback(true)
    try {
      const res = await api.get<VideoPlaybackResponse>(`/student/courses/${courseId}/topics/${topicId}/playback`)
      setPlayback(res.data)
    } catch (e) {
      const err = e as { response?: { status?: number } }
      if (err.response?.status === 402) { setGated(true); setPlaybackError("An active subscription is required to watch this video.") }
      else if (err.response?.status === 404) setPlaybackError("No video has been uploaded for this topic yet.")
      else setPlaybackError(errorMessage(e))
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
  const topics = course.topics
  const doneCount = progress?.completedTopics ?? completed.size
  const totalCount = progress?.totalTopics ?? topics.length
  const pct = progress?.percentComplete ?? (totalCount ? Math.round((doneCount / totalCount) * 100) : 0)
  const activeTitle = topics.find((t) => t.id === activeTopic)?.title

  return (
    <>
      <div className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/student/courses" className="inline-flex items-center gap-1 hover:text-foreground"><ChevronLeft className="size-4" /> My Courses</Link>
        <span>/</span>
        <span className="truncate text-foreground">{course.title}</span>
      </div>

      {gated && (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-primary" />
            <span className="text-sm">An active subscription is required to watch videos and download materials.</span>
          </div>
          <Button asChild size="sm"><Link to="/student/subscription">Subscribe</Link></Button>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: video + detail */}
        <div className="min-w-0">
          <Card className="flex aspect-video items-center justify-center overflow-hidden bg-black/90 p-0 text-white">
            {loadingPlayback ? (
              <Loader2 className="size-8 animate-spin" />
            ) : playback ? (
              <video key={playback.topicId} className="size-full" controls autoPlay src={playback.playbackUrl}>
                Your browser cannot play this video.
              </video>
            ) : playbackError ? (
              <p className="px-6 text-center text-sm text-white/70">{playbackError}</p>
            ) : (
              <div className="flex flex-col items-center gap-2 text-white/60">
                <PlayCircle className="size-10" />
                <p className="text-sm">Select a topic to start watching.</p>
              </div>
            )}
          </Card>
          {playback?.downloadEnabled && playback.downloadUrl && (
            <Button asChild variant="outline" size="sm" className="mt-3">
              <a href={playback.downloadUrl} target="_blank" rel="noreferrer"><Download className="mr-2 size-4" /> Download video</a>
            </Button>
          )}

          {/* Detail: breadcrumb + title + progress + tabs */}
          <div className="mt-5">
            <div className="text-sm text-muted-foreground">{course.title}</div>
            <h1 className="font-800 text-xl tracking-tight">{activeTitle ?? course.title}</h1>

            <div className="mt-4 flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="tabular whitespace-nowrap text-sm text-muted-foreground">{doneCount}/{totalCount} topics · {pct}% done</span>
            </div>

            <Tabs value={tab} onValueChange={setTab} className="mt-5">
              <TabsList>
                <TabsTrigger value="topics">Topics</TabsTrigger>
                <TabsTrigger value="materials">Materials</TabsTrigger>
                <TabsTrigger value="tests">Tests</TabsTrigger>
                <TabsTrigger value="qa">Q&amp;A</TabsTrigger>
              </TabsList>

              <TabsContent value="topics" className="pt-4">
                {course.description
                  ? <p className="text-sm leading-relaxed text-muted-foreground">{course.description}</p>
                  : <p className="text-sm text-muted-foreground">Select a topic from the course content to start watching.</p>}
              </TabsContent>

              <TabsContent value="materials" className="pt-4">
                {materials.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No materials for this course yet.</p>
                ) : (
                  <div className="space-y-2">
                    {materials.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => downloadMaterial(m.id)}
                        className="flex w-full items-center gap-3 rounded-lg bg-muted/50 px-4 py-3 text-left text-sm transition-colors hover:bg-muted"
                      >
                        <Download className="size-4 shrink-0 text-primary" />
                        <span className="flex-1 truncate">{m.fileName}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {(m.contentType?.includes("pdf") ? "PDF" : m.contentType?.split("/")[1]?.toUpperCase() || "FILE")}
                          {fileSize(m.sizeBytes) ? ` · ${fileSize(m.sizeBytes)}` : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tests" className="pt-4">
                {gated ? <p className="text-sm text-muted-foreground">Subscribe to take this course's tests.</p> : <CourseTests courseId={courseId} />}
              </TabsContent>

              <TabsContent value="qa" className="pt-4">
                {gated ? <p className="text-sm text-muted-foreground">Subscribe to join the discussion.</p> : <CourseDiscussion courseId={courseId} />}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right: course content list — on mobile only shown on the Topics tab; always shown on desktop */}
        <Card className={"h-fit overflow-hidden p-0 lg:sticky lg:top-4 lg:block " + (tab === "topics" ? "block" : "hidden")}>
          <div className="border-b border-border px-4 py-3">
            <div className="font-700 text-sm">Course content</div>
            <div className="text-xs text-muted-foreground">{doneCount} / {totalCount} topics completed</div>
          </div>
          <div className="max-h-[70vh] divide-y divide-border overflow-auto">
            {topics.map((t) => {
              const done = completed.has(t.id)
              const active = activeTopic === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => openTopic(t.id)}
                  className={"flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors " +
                    (active ? "bg-primary/10 text-primary" : "hover:bg-muted")}
                >
                  {done ? (
                    <CheckCircle2 className="size-4 shrink-0 text-success" />
                  ) : active ? (
                    <Play className="size-4 shrink-0 text-primary" />
                  ) : t.hasVideo ? (
                    <PlayCircle className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <Circle className="size-4 shrink-0 text-muted-foreground/40" />
                  )}
                  <span className={"flex-1 " + (active ? "font-600" : "")}>{t.title}</span>
                  {t.videoDurationSeconds ? <span className="tabular shrink-0 text-xs text-muted-foreground">{mmss(t.videoDurationSeconds)}</span> : null}
                </button>
              )
            })}
            {topics.length === 0 && <div className="px-4 py-6 text-sm text-muted-foreground">No topics yet.</div>}
          </div>
        </Card>
      </div>
    </>
  )
}
