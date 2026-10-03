import type { ComponentType, ReactNode } from "react"
import { Hourglass } from "lucide-react"
import { PageHeader } from "@/components/common"
import { Card } from "@/components/ui/card"

export interface ComingSoonItem {
  icon: ComponentType<{ className?: string }>
  title: string
  text: string
}

/**
 * Placeholder page for a section that is not ready yet: a "Coming soon" badge, a short message, a few
 * planned items and an illustration. Used by OSCE and by the course pages while the videos are recorded.
 */
export function ComingSoon({
  pageTitle, pageDescription, title, message, items, illustration,
}: {
  pageTitle: string
  pageDescription: string
  title: string
  message: string
  items: ComingSoonItem[]
  illustration: ReactNode
}) {
  return (
    <>
      <PageHeader title={pageTitle} description={pageDescription} />

      <Card className="gap-0 overflow-hidden p-0">
        <div className="grid md:grid-cols-2">
          <div className="flex flex-col justify-center p-6 sm:p-9">
            <span className="font-700 inline-flex w-fit items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1 text-[11px] uppercase tracking-widest text-warning">
              <Hourglass className="size-3.5" /> Coming soon
            </span>
            <h2 className="font-800 mt-4 text-2xl leading-tight tracking-tight sm:text-3xl">{title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{message}</p>

            <ul className="mt-6 space-y-4">
              {items.map(({ icon: Icon, title: itemTitle, text }) => (
                <li key={itemTitle} className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-[18px]" />
                  </span>
                  <div>
                    <p className="font-700 text-sm">{itemTitle}</p>
                    <p className="text-sm text-muted-foreground">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-accent/40 p-6 sm:p-9">
            {illustration}
          </div>
        </div>
      </Card>
    </>
  )
}
