import { toast } from "sonner"
import { Check, Copy, Landmark, Mail, MessageCircle } from "lucide-react"
import { api } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import { useAuth } from "@/context/AuthContext"
import type { ManualPaymentInfoResponse } from "@/lib/types"
import { formatNaira } from "@/components/common"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Props {
  /** Plan price in kobo, so the student knows exactly how much to send. Omitted if no plan yet. */
  priceKobo?: number
  /** True when the student already has an active subscription (copy changes to "renew"). */
  active: boolean
}

function CopyRow({ label, value }: { label: string; value: string }) {
  async function copy() {
    try {
      // Global copy-protection blocks `copy` events, so use the async Clipboard API directly.
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copied`)
    } catch {
      toast.error("Couldn't copy — please type it in manually")
    }
  }
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="selectable break-words font-medium">{value}</p>
      </div>
      <Button type="button" size="sm" variant="outline" onClick={copy} aria-label={`Copy ${label}`}>
        <Copy className="mr-1.5 size-3.5" /> Copy
      </Button>
    </div>
  )
}

/**
 * Alternative to Paystack: the student pays by bank transfer, then sends the receipt over WhatsApp or
 * email and an admin activates the subscription manually. Renders nothing if the details can't load.
 */
export function BankTransferCard({ priceKobo, active }: Props) {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Landmark className="size-5 text-primary" />
          <CardTitle>Pay by bank transfer</CardTitle>
        </div>
        <CardDescription>
          Prefer not to pay online? Transfer directly, send us the receipt, and we'll {active ? "extend" : "activate"} your subscription.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ol className="space-y-4 text-sm">
          <li className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">1</span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">Transfer {amount} to this account</p>
              <div className="mt-2 divide-y rounded-md border px-3">
                <CopyRow label="Bank" value={d.bankName} />
                <CopyRow label="Account name" value={d.accountName} />
                <CopyRow label="Account number" value={d.accountNumber} />
              </div>
            </div>
          </li>

          <li className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">2</span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">Send us your receipt</p>
              <p className="mt-1 text-muted-foreground">
                Attach a screenshot or PDF of the transfer receipt and include the email you registered with
                (<span className="selectable font-medium text-foreground">{user?.email}</span>), so we can find your account. The buttons below
                pre-fill this for you.
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {d.whatsappNumbers.map((num) => (
                  <Button key={num} asChild variant="outline" className="h-auto justify-start whitespace-normal break-all py-2 text-left">
                    <a
                      href={`https://wa.me/${num.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="mr-2 size-4 text-success" />
                      WhatsApp {num}
                    </a>
                  </Button>
                ))}
                <Button asChild variant="outline" className="h-auto justify-start whitespace-normal break-all py-2 text-left">
                  <a href={`mailto:${d.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`}>
                    <Mail className="mr-2 size-4 text-primary" />
                    Email {d.email}
                  </a>
                </Button>
              </div>
            </div>
          </li>

          <li className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">3</span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">We confirm and activate you</p>
              <p className="mt-1 flex items-start gap-1.5 text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-success" />
                Once we've confirmed your payment, this page will show your subscription as active. Refresh the page after you hear from us.
              </p>
            </div>
          </li>
        </ol>
      </CardContent>
    </Card>
  )
}
