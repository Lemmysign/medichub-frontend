import { useEffect, useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Sidebar } from "@/components/layout/Sidebar"
import { TopBar } from "@/components/layout/TopBar"
import { cn } from "@/lib/utils"

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("mh_sidebar_collapsed") === "1")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem("mh_theme") === "dark")

  // Apply + persist theme.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    localStorage.setItem("mh_theme", dark ? "dark" : "light")
  }, [dark])

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setMobileOpen(false) }, [pathname])

  if (!user) return null

  function toggleCollapse() {
    setCollapsed((c) => {
      localStorage.setItem("mh_sidebar_collapsed", c ? "0" : "1")
      return !c
    })
  }

  async function handleLogout() {
    await logout()
    navigate("/login")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar (drawer on mobile, static on desktop) */}
      <div
        className={cn(
          "fixed z-50 h-full transition-transform duration-200 lg:relative lg:z-auto lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <Sidebar
          role={user.role}
          collapsed={collapsed}
          userName={user.fullName}
          userEmail={user.email}
          onToggleCollapse={toggleCollapse}
          onNavigate={() => setMobileOpen(false)}
          onLogout={handleLogout}
        />
      </div>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar
          role={user.role}
          darkMode={dark}
          onToggleDark={() => setDark((d) => !d)}
          onToggleSidebar={() => setMobileOpen((v) => !v)}
        />
        <main className="flex-1 overflow-auto bg-background">
          <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
