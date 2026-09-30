import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { ShieldCheck } from "lucide-react"
import { LogoMark } from "@/components/Logo"

interface Quote {
  text: string
  author: string
  meta: string
  initials: string
}

/**
 * Two-panel auth layout (ported from the Figma design): a teal brand panel on the
 * left (hidden on small screens) and the form on the right. Pass a {@link quote} for
 * the marketing testimonial, or set `variant="admin"` for the stripped-back admin panel.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  quote,
  variant = "default",
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  quote?: Quote
  variant?: "default" | "admin"
}) {
  const admin = variant === "admin"
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left brand panel */}
      <div
        className="relative hidden w-[420px] shrink-0 flex-col justify-between overflow-hidden p-10 lg:flex"
        style={{ background: "linear-gradient(160deg, oklch(0.42 0.13 196) 0%, oklch(0.30 0.10 210) 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 70% 30%, white 0%, transparent 60%)" }}
        />
        <Link to="/" className="relative flex items-center gap-2.5">
          <LogoMark size={36} />
          <div className="leading-none">
            <div className="font-800 text-base tracking-tight text-white">MedicHub</div>
            <div className="font-600 text-[9px] uppercase tracking-widest text-white/70">Academy</div>
          </div>
        </Link>

        <div className="relative">
          {admin ? (
            <>
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-white/15">
                <ShieldCheck size={22} className="text-white" />
              </div>
              <blockquote className="font-600 mb-2 text-xl leading-relaxed text-white">
                Administrator console
              </blockquote>
              <p className="text-sm text-white/70">
                Manage accounts, subscriptions, revenue and platform settings for MedicHub Academy.
              </p>
            </>
          ) : quote ? (
            <>
              <blockquote className="font-600 mb-4 text-xl leading-relaxed text-white">
                &ldquo;{quote.text}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="font-700 flex size-9 items-center justify-center rounded-full bg-white/20 text-xs text-white">
                  {quote.initials}
                </div>
                <div>
                  <div className="font-700 text-sm text-white">{quote.author}</div>
                  <div className="text-xs text-white/70">{quote.meta}</div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        <div className="relative text-xs text-white/50">© 2025 MedicHub Academy</div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <LogoMark size={32} />
            <span className="font-800 text-sm">MedicHub Academy</span>
          </Link>

          <h1 className="font-800 mb-1 text-2xl tracking-tight">{title}</h1>
          {subtitle && <p className="mb-6 text-sm text-muted-foreground">{subtitle}</p>}

          {children}

          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
