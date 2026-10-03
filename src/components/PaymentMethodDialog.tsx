import { ChevronRight, CreditCard, Loader2, ShieldCheck, Wallet } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export type Gateway = "paystack" | "squad"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Only the gateways that are switched on and allowed for this student. */
  gateways: Gateway[]
  /** The gateway whose checkout is being started right now (locks the dialog while we redirect). */
  busy: Gateway | null
  onChoose: (gateway: Gateway) => void
}

const OPTIONS: Record<Gateway, { title: string; Icon: typeof CreditCard; tile: string }> = {
  paystack: { title: "Pay with Paystack", Icon: CreditCard, tile: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground" },
  squad: { title: "Pay with Squad", Icon: Wallet, tile: "bg-warning/15 text-warning group-hover:bg-warning group-hover:text-white" },
}

/** "Choose how to pay" — shown only when the student really has a choice between online gateways. */
export function PaymentMethodDialog({ open, onOpenChange, gateways, busy, onChoose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next) }}>
      {/* No description on purpose: the dialog is just a title and two choices. */}
      <DialogContent aria-describedby={undefined} className="gap-6 overflow-hidden rounded-2xl p-0 sm:max-w-sm">
        <div className="bg-gradient-to-b from-primary/10 to-transparent px-6 pt-8 pb-2">
          <DialogHeader className="items-center gap-3 text-center sm:text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/30">
              <ShieldCheck className="size-6" />
            </span>
            <DialogTitle className="text-xl">Choose how to pay</DialogTitle>
          </DialogHeader>
        </div>

        <div className="space-y-3 px-6 pb-7" role="group" aria-label="Payment method">
          {gateways.map((g) => {
            const { title, Icon, tile } = OPTIONS[g]
            const isBusy = busy === g
            return (
              <button
                key={g}
                type="button"
                onClick={() => onChoose(g)}
                disabled={busy != null}
                className={cn(
                  "group flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left shadow-sm",
                  "transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-y-0 active:scale-[0.99]",
                  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm",
                  isBusy && "border-primary opacity-100 shadow-md",
                )}
              >
                <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors", tile)}>
                  <Icon className="size-5" />
                </span>
                <span className="flex-1 text-base font-semibold">{title}</span>
                {isBusy ? (
                  <Loader2 className="size-5 animate-spin text-primary" />
                ) : (
                  <ChevronRight className="size-5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" />
                )}
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
