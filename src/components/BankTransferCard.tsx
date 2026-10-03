import { toast } from "sonner"
import { Copy, Landmark, Mail, MessageCircle } from "lucide-react"
import { api } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import { useAuth } from "@/context/AuthContext"
import type { ManualPaymentInfoResponse } from "@/lib/types"
import { formatNaira } from "@/components/common"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Props {
  /** Plan price in kobo, so the student knows exactly how much to send. Omitted if no plan yet. */
  priceKobo?: number
}

/** +2348158626636 -> +234 815 862 6636 (falls back to the raw value for any other shape). */
function prettyPhone(num: string) {
  return num.replace(/^\+234(\d{3})(\d{3})(\d{4})$/, "+234 $1 $2 $3")
}

/**
 * The alternative to paying online: transfer to the account, then send the receipt. Kept deliberately short —
 * the account, one Copy button, two ways to send the receipt. Renders nothing if the details can't load.
 */
export function BankTransferCard({ priceKobo }: Props) {
  const { user } = useAuth()
  const info = useApi(
    () => api.get<ManualPaymentInfoResponse>("/student/subscription/manual-payment").then((r) => r.data).catch(() => null),
    [],
  )
  const d = info.data
  if (info.loading || !d) return null

  const amount = priceKobo ? formatNaira(priceKobo) : "the subscription fee"
  const message =
    `Hello MedicHub Academy, I have paid ${amount} for my subscription by bank transfer.\n` +
    `Name: ${user?.fullName ?? ""}\nAccount email: ${user?.email ?? ""}\nMy payment receipt is attached.`
  const subject = `Subscription payment receipt - ${user?.fullName ?? "MedicHub Academy student"}`

  async function copyAccountNumber() {
    try {
      // Global copy-protection blocks `copy` events, so use the async Clipboard API directly.
      await navigator.clipboard.writeText(d!.accountNumber)
      toast.success("Account number copied")
    } catch {
      toast.error("Couldn't copy — please type it in")
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Landmark className="size-5 text-primary" />
          <CardTitle>Pay by bank transfer</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="text-sm font-medium">1. Transfer {amount} to</p>
          <div className="mt-2 rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">{d.bankName}</p>
            <p className="selectable text-sm font-medium">{d.accountName}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="selectable text-2xl font-semibold tracking-wider tabular-nums">{d.accountNumber}</p>
              <Button type="button" size="sm" variant="outline" onClick={copyAccountNumber} aria-label="Copy account number">
                <Copy className="mr-1.5 size-3.5" /> Copy
              </Button>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium">2. Send us the receipt</p>
          <div className="mt-2 flex flex-col gap-2">
            {d.whatsappNumbers.map((num) => (
              <Button key={num} asChild variant="outline" className="h-auto justify-start py-2.5">
                <a
                  href={`https://wa.me/${num.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 size-4 shrink-0 text-success" />
                  <span className="text-sm">{prettyPhone(num)}</span>
                </a>
              </Button>
            ))}
            <Button asChild variant="outline" className="h-auto justify-start py-2.5">
              <a href={`mailto:${d.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`}>
                <Mail className="mr-2 size-4 shrink-0 text-primary" />
                Email the receipt
              </a>
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">We activate your subscription once we confirm your payment.</p>
      </CardContent>
    </Card>
  )
}
