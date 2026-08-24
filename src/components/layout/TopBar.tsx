import { useLocation } from "react-router-dom"
import { Moon, Sun, Bell, Menu } from "lucide-react"
import { api } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { Role, SubscriptionStatusResponse } from "@/lib/types"
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

        <button
          aria-label="Notifications"
          className="relative flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
        >
          <Bell size={17} />
        </button>

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
