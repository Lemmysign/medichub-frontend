import { useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Moon, Sun, Bell, Menu, HelpCircle, MessageSquareReply, Inbox } from "lucide-react"
import { api } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { CommentResponse, PagedResponse, Role, SubscriptionStatusResponse } from "@/lib/types"
import { cn } from "@/lib/utils"

/** Ordered longest-prefix-first so nested routes win. */
const TITLES: [string, string][] = [
  ["/student/mock-exams", "Mock Exams"],
  ["/student/courses", "My Courses"],
  ["/student/subscription", "Subscription"],
  ["/student", "Dashboard"],
  ["/browse", "Browse Courses"],
  ["/instructor/courses", "My Courses"],
  ["/instructor/mock-exams", "Mock Exams"],
  ["/instructor/questions", "Q&A Inbox"],
  ["/instructor", "Dashboard"],
  ["/admin/users", "Accounts"],
  ["/admin/mock-exams", "Mock Exams"],
  ["/admin/plan", "Subscription Plan"],
  ["/admin/settings", "Platform Settings"],
  ["/admin", "Dashboard"],
  ["/account", "Account Settings"],
]

function titleFor(pathname: string): string {
  for (const [prefix, title] of TITLES) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return title
  }
  return "MedicHub Academy"
}

interface Props {
  role: Role
  darkMode: boolean
  onToggleDark: () => void
  onToggleSidebar: () => void
}

export function TopBar({ role, darkMode, onToggleDark, onToggleSidebar }: Props) {
  const { pathname } = useLocation()
  const sub = useApi(
    () => (role === "STUDENT"
      ? api.get<SubscriptionStatusResponse>("/student/subscription").then((r) => r.data)
      : Promise.resolve(null)),
    [role],
  )
  const title = titleFor(pathname)

  return (
    <header
      className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4"
      style={{ height: "var(--topbar-height)" }}
    >
      <button
        onClick={onToggleSidebar}
        aria-label="Open menu"
        className="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted lg:hidden"
      >
        <Menu size={18} />
      </button>

      <h1 className="font-700 flex-1 truncate text-sm text-foreground">{title}</h1>

      <div className="flex items-center gap-1">
        {role === "STUDENT" && sub.data && (
          <span
            className={cn(
              "font-700 mr-1 hidden items-center gap-1 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-widest sm:inline-flex",
              sub.data.active ? "bg-success/15 text-success" : "bg-destructive/12 text-destructive",
            )}
          >
            {sub.data.active ? "Active" : "No Plan"}
          </span>
        )}

        <NotificationsBell role={role} />

        <button
          onClick={onToggleDark}
          aria-label="Toggle dark mode"
          className="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
        >
          {darkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  )
}

/* ------------------------------------------------------------------ notifications */

interface Notif {
  key: string
  to: string
  kind: "question" | "reply"
  title: string
  body: string
  where: string
  time: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d < 7 ? `${d}d ago` : new Date(iso).toLocaleDateString()
}

/** Map a comment thread to a notification for the current role. Returns null if nothing to show. */
function toNotif(role: Role, c: CommentResponse): Notif | null {
  const where = [c.courseTitle, c.topicTitle].filter(Boolean).join(" · ")
  if (role === "INSTRUCTOR") {
    return {
      key: `q-${c.id}`,
      to: `/instructor/courses/${c.courseId}`,
      kind: "question",
      title: `${c.authorName} asked a question`,
      body: c.text,
      where,
      time: c.createdAt,
    }
  }
  // STUDENT — surface the latest reply on their question.
  const reply = c.replies?.[c.replies.length - 1]
  if (!reply) return null
  return {
    key: `r-${reply.id}`,
    to: `/student/courses/${c.courseId}`,
    kind: "reply",
    title: `${reply.authorName} replied to your question`,
    body: reply.text,
    where,
    time: reply.createdAt,
  }
}

function NotificationsBell({ role }: { role: Role }) {
  const navigate = useNavigate()
  const enabled = role === "STUDENT" || role === "INSTRUCTOR"
  const readKey = `mh_notif_read_${role}`
  const [open, setOpen] = useState(false)
  // Keys the user has already opened — persisted so viewed items stay gone across navigation/reloads.
  const [read, setRead] = useState<Set<string>>(() => {
    try { return new Set<string>(JSON.parse(localStorage.getItem(readKey) ?? "[]")) } catch { return new Set() }
  })

  const { data, reload } = useApi(
    () =>
      !enabled
        ? Promise.resolve(null)
        : role === "STUDENT"
          ? api.get<PagedResponse<CommentResponse>>("/student/questions", { params: { size: 10 } }).then((r) => r.data)
          : api.get<PagedResponse<CommentResponse>>("/instructor/questions", { params: { unansweredOnly: true, size: 10 } }).then((r) => r.data),
    [role],
  )

  const notifs = useMemo(
    () => (data?.content ?? []).map((c) => toNotif(role, c)).filter((n): n is Notif => n !== null),
    [data, role],
  )
  // Hide anything already opened; the badge counts only what's left.
  const visibleNotifs = useMemo(() => notifs.filter((n) => !read.has(n.key)), [notifs, read])
  const unread = visibleNotifs.length

  function toggle() {
    const next = !open
    setOpen(next)
    if (next) reload()
  }

  function openNotif(n: Notif) {
    // Mark this one read; prune stale keys no longer in the feed so storage stays bounded.
    const live = new Set(notifs.map((x) => x.key))
    const nextRead = new Set([...read].filter((k) => live.has(k)))
    nextRead.add(n.key)
    localStorage.setItem(readKey, JSON.stringify([...nextRead]))
    setRead(nextRead)
    setOpen(false)
    navigate(n.to)
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-4 text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* click-away backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="font-700 text-sm">Notifications</span>
              <span className="text-[11px] text-muted-foreground">
                {role === "INSTRUCTOR" ? "Pending questions" : "Replies to you"}
              </span>
            </div>

            <div className="max-h-[22rem] overflow-y-auto">
              {visibleNotifs.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-muted-foreground">
                  <Inbox size={22} />
                  <p className="text-sm">You're all caught up.</p>
                </div>
              ) : (
                visibleNotifs.map((n) => (
                  <button
                    key={n.key}
                    onClick={() => openNotif(n)}
                    className="flex w-full gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                        n.kind === "question" ? "bg-warning/15 text-warning" : "bg-primary/10 text-primary",
                      )}
                    >
                      {n.kind === "question" ? <HelpCircle size={16} /> : <MessageSquareReply size={16} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-600 text-foreground">{n.title}</span>
                      <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">{n.body}</span>
                      <span className="mt-1 flex items-center justify-between gap-2">
                        <span className="truncate text-[11px] text-primary">{n.where}</span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(n.time)}</span>
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
