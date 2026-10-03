import type { ComponentType, ReactNode } from "react"
import { Loader2, type LucideProps } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type StatAccent = "primary" | "success" | "warning" | "accent" | "destructive"

const STAT_ACCENT: Record<StatAccent, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  accent: "bg-accent text-accent-foreground",
  destructive: "bg-destructive/10 text-destructive",
}

export function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  accent = "primary",
}: {
  label: string
  value: ReactNode
  icon?: ComponentType<LucideProps>
  /** Optional small caption under the label (e.g. "+2 this month"). */
  sub?: ReactNode
  /** Colour of the icon chip. */
  accent?: StatAccent
}) {
  return (
    <Card className="p-4">
      {Icon && (
        <div className={"mb-3 flex size-9 items-center justify-center rounded-md " + STAT_ACCENT[accent]}>
          <Icon className="size-[18px]" />
        </div>
      )}
      <p className="tabular font-800 text-2xl leading-none">{value}</p>
      <p className="font-500 mt-1.5 text-xs text-muted-foreground">{label}</p>
      {sub && <p className="mt-0.5 text-[10px] text-muted-foreground/80">{sub}</p>}
    </Card>
  )
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={"size-5 animate-spin text-primary " + (className ?? "")} />
}

export function CenteredSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Spinner className="size-6" />
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
      {message}
      {onRetry && (
        <div className="mt-3">
          <Button type="button" size="sm" variant="outline" onClick={onRetry}>Try again</Button>
        </div>
      )}
    </div>
  )
}

/**
 * Wraps content that is being re-fetched (next page, new filter): the old content is dimmed and locked and a
 * "Loading…" pill sits at the top, so nobody reads or answers stale content without knowing it is about to change.
 */
export function LoadingOverlay({ active, label = "Loading…", children }: { active: boolean; label?: string; children: ReactNode }) {
  return (
    <div className="relative" aria-busy={active}>
      {active && (
        <div role="status" aria-live="polite" className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center pt-3">
          <span className="font-600 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm shadow-md">
            <Loader2 className="size-4 animate-spin text-primary" /> {label}
          </span>
        </div>
      )}
      <div className={active ? "pointer-events-none select-none opacity-40 transition-opacity" : "transition-opacity"}>{children}</div>
    </div>
  )
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-lg border border-dashed p-10 text-center">
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}

/** Format kobo (Long) as Naira for display. */
export function formatNaira(kobo: number): string {
  return "₦" + (kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}
