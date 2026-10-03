import { NavLink } from "react-router-dom"
import {
  LayoutDashboard, BookOpen, Library, ClipboardList, CreditCard,
  Settings, MessageSquare, Users, ChevronLeft, ChevronRight,
  Activity, LogOut, History, Tags, UserCheck, ListChecks, Stethoscope,
} from "lucide-react"
import type { Role } from "@/lib/types"
import { cn } from "@/lib/utils"
import { LogoMark } from "@/components/Logo"

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  end?: boolean
}

function navItems(role: Role): NavItem[] {
  if (role === "STUDENT") {
    return [
      { to: "/student", label: "Dashboard", icon: <LayoutDashboard size={18} />, end: true },
      { to: "/browse", label: "Browse Courses", icon: <BookOpen size={18} /> },
      { to: "/student/courses", label: "My Courses", icon: <Library size={18} /> },
      { to: "/student/mock-exams", label: "Mock exam", icon: <ClipboardList size={18} /> },
      { to: "/student/mcqs", label: "MCQs", icon: <ListChecks size={18} /> },
      { to: "/student/recalls", label: "Recalls", icon: <History size={18} /> },
      { to: "/student/osce", label: "OSCE", icon: <Stethoscope size={18} /> },
      { to: "/student/subscription", label: "Subscription", icon: <CreditCard size={18} /> },
    ]
  }
  if (role === "INSTRUCTOR") {
    return [
      { to: "/instructor", label: "Dashboard", icon: <LayoutDashboard size={18} />, end: true },
      { to: "/instructor/courses", label: "My Courses", icon: <Library size={18} /> },
      { to: "/instructor/mock-exams", label: "Mock Exam", icon: <ClipboardList size={18} /> },
      { to: "/instructor/mcqs", label: "MCQs", icon: <ListChecks size={18} /> },
      { to: "/instructor/recalls", label: "Recalls", icon: <History size={18} /> },
      { to: "/instructor/questions", label: "Q&A Inbox", icon: <MessageSquare size={18} /> },
    ]
  }
  return [
    { to: "/admin", label: "Dashboard", icon: <LayoutDashboard size={18} />, end: true },
    { to: "/admin/users", label: "Accounts", icon: <Users size={18} /> },
    { to: "/admin/approvals", label: "Approvals", icon: <UserCheck size={18} /> },
    { to: "/admin/mock-exams", label: "Mock Exam", icon: <ClipboardList size={18} /> },
    { to: "/admin/mcqs", label: "MCQs", icon: <ListChecks size={18} /> },
    { to: "/admin/recalls", label: "Recalls", icon: <History size={18} /> },
    { to: "/admin/subjects", label: "Subjects", icon: <Tags size={18} /> },
    { to: "/admin/plan", label: "Plan", icon: <CreditCard size={18} /> },
    { to: "/admin/settings", label: "Settings", icon: <Settings size={18} /> },
  ]
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

interface Props {
  role: Role
  collapsed: boolean
  userName: string
  userEmail: string
  onToggleCollapse: () => void
  onNavigate: () => void
  onLogout: () => void
}

export function Sidebar({ role, collapsed, userName, userEmail, onToggleCollapse, onNavigate, onLogout }: Props) {
  const items = navItems(role)
  const roleLabel = role === "STUDENT" ? "Student" : role === "INSTRUCTOR" ? "Instructor" : "Admin"
  const roleColor =
    role === "STUDENT" ? "bg-primary text-primary-foreground"
    : role === "INSTRUCTOR" ? "bg-success text-success-foreground"
    : "bg-warning text-warning-foreground"

  return (
    <aside
      className="flex h-full flex-col border-r border-border bg-card transition-[width] duration-200"
      style={{ width: collapsed ? "var(--sidebar-collapsed-width)" : "var(--sidebar-width)" }}
    >
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
        <LogoMark size={32} />
        {!collapsed && (
          <div className="flex flex-col leading-none">
            <span className="font-800 text-sm tracking-tight text-foreground">MedicHub</span>
            <span className="font-500 text-[10px] uppercase tracking-wider text-muted-foreground">Academy</span>
          </div>
        )}
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-1">
          <span className={cn("font-700 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest", roleColor)}>
            <Activity size={9} /> {roleLabel} Portal
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                "font-500 mb-0.5 flex w-full items-center gap-3 rounded-md px-2.5 py-2.5 text-left text-sm transition-colors duration-150",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: account + logout */}
      <div className="shrink-0 border-t border-border px-2 py-2">
        <NavLink
          to="/account"
          onClick={onNavigate}
          title={collapsed ? "Account settings" : undefined}
          className={({ isActive }) =>
            cn(
              "font-500 mb-0.5 flex w-full items-center gap-3 rounded-md px-2.5 py-2.5 text-sm transition-colors",
              isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )
          }
        >
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-700 text-primary-foreground">
            {initials(userName)}
          </div>
          {!collapsed && (
            <div className="flex min-w-0 flex-col leading-none text-left">
              <span className="font-600 truncate text-xs text-foreground">{userName}</span>
              <span className="truncate text-[10px] text-muted-foreground">{userEmail}</span>
            </div>
          )}
        </NavLink>
        <button
          onClick={onLogout}
          title={collapsed ? "Sign out" : undefined}
          className="font-500 flex w-full cursor-pointer items-center gap-3 rounded-md px-2.5 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>

      {/* Collapse toggle (desktop only) */}
      <button
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-16 z-10 hidden size-6 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground lg:flex"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}
