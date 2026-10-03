import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import { useConfirm } from "@/components/ConfirmDialogProvider"
import type {
  InitializeSubscriptionResponse,
  PaymentOptionsResponse,
  PaymentVerificationResponse,
  SubscriptionPlanResponse,
  SubscriptionStatusResponse,
} from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState, formatNaira } from "@/components/common"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BankTransferCard } from "@/components/BankTransferCard"
import { PaymentMethodDialog, type Gateway } from "@/components/PaymentMethodDialog"
import { CheckCircle2, Loader2 } from "lucide-react"

export function SubscriptionPage() {
  const [params, setParams] = useSearchParams()
  const status = useApi(() => api.get<SubscriptionStatusResponse>("/student/subscription").then((r) => r.data), [])
  const plan = useApi(() => api.get<SubscriptionPlanResponse>("/public/subscription-plan").then((r) => r.data).catch(() => null), [])
  // Which gateways are switched on. If this can't be read, behave as before (Paystack only).
  const options = useApi(() => api.get<PaymentOptionsResponse>("/public/payment-options").then((r) => r.data).catch(() => null), [])
  const [starting, setStarting] = useState(false)
  const [startingSquad, setStartingSquad] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [chooserOpen, setChooserOpen] = useState(false)
  const confirm = useConfirm()

  // The two gateways return to this page differently: Paystack adds ?reference=..., ours for Squad is
  // ?provider=squad&ref=... (Squad may add its own ?reference= too). Capture once, up front, so a Squad
  // return is never mistaken for a Paystack one, and so React re-running effects can't lose it.
  const returned = useRef(
    params.get("provider") === "squad"
      ? { squadRef: params.get("ref"), paystackRef: null as string | null }
      : { squadRef: null as string | null, paystackRef: params.get("reference") },
  )

  // Handle the Paystack callback (?reference=...) after checkout.
  useEffect(() => {
    const reference = returned.current.paystackRef
    if (!reference) return
    api
      .get<SubscriptionStatusResponse>(`/student/subscription/verify/${reference}`)
      .then((r) => {
        if (r.data.active) toast.success("Subscription activated!")
        else toast.message("Payment received — activation pending.")
        status.reload()
      })
      .catch((e) => toast.error(errorMessage(e)))
      .finally(() => {
        params.delete("reference")
        setParams(params, { replace: true })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle the Squad return (?provider=squad&ref=...). Squad confirms asynchronously, so keep asking for
  // a short while; the server also settles it on its own (webhook + background sweep) if we give up first.
  useEffect(() => {
    const ref = returned.current.squadRef
    if (!ref) return
    let cancelled = false
    const toastId = toast.loading("Confirming your payment with Squad…")
    ;(async () => {
      try {
        for (let attempt = 0; attempt < 6 && !cancelled; attempt++) {
          const r = await api.get<PaymentVerificationResponse>(`/student/subscription/squad/verify/${ref}`)
          if (cancelled) return
          if (r.data.outcome === "PAID") {
            toast.success("Payment confirmed — your subscription is active!", { id: toastId })
            status.reload()
            return
          }
          if (r.data.outcome === "FAILED") {
            toast.error("Squad reported that this payment didn't go through. No subscription time was added.", { id: toastId })
            return
          }
          await new Promise((resolve) => setTimeout(resolve, 4000))
        }
        if (!cancelled) {
          toast.message(
            "We haven't received confirmation yet. If you completed the payment, your subscription will activate automatically within a few minutes.",
            { id: toastId, duration: 10000 },
          )
          status.reload()
        }
      } catch (e) {
        if (!cancelled) toast.error(errorMessage(e), { id: toastId })
      }
    })()
    if (params.has("provider") || params.has("ref")) {
      ;["provider", "ref", "reference", "trxref"].forEach((key) => params.delete(key))
      setParams(params, { replace: true })
    }
    return () => {
      cancelled = true
      toast.dismiss(toastId) // never leave a spinner behind if the page goes away mid-check
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function payWithSquad() {
    setStartingSquad(true)
    try {
      const res = await api.post<InitializeSubscriptionResponse>("/student/subscription/squad/initialize")
      window.location.href = res.data.authorizationUrl
    } catch (e) {
      toast.error(errorMessage(e, "Could not start checkout"))
      setStartingSquad(false)
    }
  }

  async function subscribe() {
    setStarting(true)
    try {
      const res = await api.post<InitializeSubscriptionResponse>("/student/subscription/initialize")
      window.location.href = res.data.authorizationUrl
    } catch (e) {
      toast.error(errorMessage(e, "Could not start checkout"))
      setStarting(false)
    }
  }

  async function cancelSubscription() {
    const endDateText = s.endDate ? new Date(s.endDate).toLocaleDateString() : "your current period's end"
    const ok = await confirm(
      `You'll keep full access until ${endDateText}. After that, you won't be charged again and access will end unless you resubscribe.`,
      { title: "Cancel auto-renewal?", confirmLabel: "Cancel auto-renewal", cancelLabel: "Keep subscription" },
    )
    if (!ok) return
    setCancelling(true)
    try {
      await api.post("/student/subscription/cancel")
      toast.success("Auto-renewal cancelled — you're still covered until your period ends.")
      status.reload()
    } catch (e) {
      toast.error(errorMessage(e, "Could not cancel right now"))
    } finally {
      setCancelling(false)
    }
  }

  if (status.loading) return <CenteredSpinner />
  if (status.error) return <ErrorState message={status.error} />
  const s = status.data!
  const p = plan.data
  const endDateText = s.endDate ? new Date(s.endDate).toLocaleDateString() : "—"
  const paystackOn = options.data ? options.data.paystack : true
  const squadOn = options.data?.squad === true
  // A Squad payment is one-off, so it must never be offered on top of an auto-renewing Paystack subscription.
  const autoRenewing = s.active && s.autoRenews && !s.cancelAtPeriodEnd
  // Which gateways this student can use right now. An active student can only top up with a one-off
  // payment: Paystack would start a second recurring plan, which was never allowed from this page.
  const gateways: Gateway[] = autoRenewing
    ? []
    : s.active
      ? (squadOn ? ["squad"] : [])
      : [...(paystackOn ? (["paystack"] as Gateway[]) : []), ...(squadOn ? (["squad"] as Gateway[]) : [])]
  const busyGateway: Gateway | null = starting ? "paystack" : startingSquad ? "squad" : null

  function startCheckout(gateway: Gateway) {
    return gateway === "paystack" ? subscribe() : payWithSquad()
  }

  // One gateway: no question to ask, go straight there. Several: let the student choose.
  function onSubscribeClick() {
    if (gateways.length === 1) {
      void startCheckout(gateways[0])
    } else if (gateways.length > 1) {
      setChooserOpen(true)
    }
  }

  return (
    <>
      <PageHeader title="Subscription" description="One plan unlocks everything on MedicHub Academy" />

      {s.active ? (
        <Card className="mb-6 border-success/40 bg-success/5 p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5 text-success" />
            <div>
              <p className="font-medium">Your subscription is active</p>
              <p className="text-sm text-muted-foreground">
                {s.planName} •{" "}
                {s.cancelAtPeriodEnd
                  ? `cancelled — access ends ${endDateText}`
                  : s.autoRenews
                    ? `auto-renews ${endDateText}`
                    : `expires ${endDateText}`}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <p className="mb-6 text-sm text-muted-foreground">
          Status: <Badge variant="secondary">{s.status ?? "None"}</Badge>
        </p>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-2 xl:max-w-5xl">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>{p ? p.name : "Subscription plan"}</CardTitle>
        </CardHeader>
        <CardContent>
          {p ? (
            <>
              <p className="text-3xl font-semibold">
                {formatNaira(p.priceKobo)}
                <span className="text-base font-normal text-muted-foreground"> / {p.intervalDays} days</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /> Full access to every course & video</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /> Timed mock exams with instant grading</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /> MCQs practice bank by subject</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /> Recalls - past exam questions with explained answers</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /> Downloadable course materials</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /> Progress tracking on every course</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /> Full test attempt history & scores</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /> Ask-the-instructor Q&A on any course</li>
              </ul>
              <Button
                className="mt-6 w-full"
                onClick={onSubscribeClick}
                disabled={gateways.length === 0 || busyGateway != null}
              >
                {busyGateway != null && <Loader2 className="mr-2 size-4 animate-spin" />}
                {gateways.length === 0 && s.active
                  ? "Subscribed"
                  : s.active
                    ? `Extend ${p.intervalDays} days`
                    : "Subscribe"}
              </Button>
              {s.active && gateways.length === 1 && gateways[0] === "squad" && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  One-time payment for {p.intervalDays} days, added to your current period. It doesn't renew automatically.
                </p>
              )}

              {!s.active && gateways.length === 0 && (
                <p className="mt-6 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                  Online payment isn't available right now. Please pay by bank transfer using the details alongside.
                </p>
              )}

              {s.active && s.autoRenews && !s.cancelAtPeriodEnd && (
                <Button
                  variant="ghost"
                  className="mt-2 w-full text-muted-foreground hover:text-destructive"
                  onClick={cancelSubscription}
                  disabled={cancelling}
                >
                  {cancelling && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Cancel auto-renewal
                </Button>
              )}
              {s.active && s.cancelAtPeriodEnd && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Auto-renewal cancelled. You keep access until {endDateText}.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No plan is configured yet. Please check back soon.</p>
          )}
        </CardContent>
      </Card>

      <BankTransferCard priceKobo={p?.priceKobo} active={s.active} />
      </div>

      {p && (
        <PaymentMethodDialog
          open={chooserOpen}
          onOpenChange={setChooserOpen}
          gateways={gateways}
          busy={busyGateway}
          onChoose={(g) => void startCheckout(g)}
        />
      )}
    </>
  )
}
