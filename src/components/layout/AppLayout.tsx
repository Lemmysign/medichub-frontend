import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import type { Role } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { GraduationCap, LogOut, User as UserIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  to: string
  label: string
  end?: boolean
}

const NAV: Record<Role, NavItem[]> = {
  STUDENT: [
    { to: "/student", label: "Dashboard", end: true },
    { to: "/browse", label: "Browse Courses" },
    { to: "/student/courses", label: "My Courses" },
    { to: "/student/mock-exams", label: "Mock Exams" },
    { to: "/student/subscription", label: "Subscription" },
  ],
  INSTRUCTOR: [
    { to: "/instructor", label: "Dashboard", end: true },
    { to: "/instructor/courses", label: "My Courses" },
    { to: "/instructor/mock-exams", label: "Mock Exams" },
    { to: "/instructor/questions", label: "Q&A" },
  ],
  ADMIN: [
    { to: "/admin", label: "Dashboard", end: true },
    { to: "/admin/users", label: "Accounts" },
    { to: "/admin/mock-exams", label: "Mock Exams" },
    { to: "/admin/plan", label: "Plan" },
    { to: "/admin/settings", label: "Settings" },
  ],
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  if (!user) return null
  const items = NAV[user.role]

  async function handleLogout() {
    await logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
          <div className="flex items-center gap-2 font-semibold text-primary">
            <GraduationCap className="size-6" />
            <span className="hidden sm:inline">MedicHub Academy</span>
          </div>
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {initials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium md:inline">{user.fullName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user.fullName}</span>
                  <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/account")}>
                <UserIcon className="mr-2 size-4" /> Account settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} variant="destructive">
                <LogOut className="mr-2 size-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
