import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import { useConfirm } from "@/components/ConfirmDialogProvider"
import { openPaystackPopup, openSquadModal } from "@/lib/gatewayCheckout"
import type {
  InitializeSubscriptionResponse,
  PaymentOptionsResponse,
  PaymentVerificationResponse,
  SquadCheckoutSession,
  SubscriptionPlanResponse,
  SubscriptionStatusResponse,
} from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState, formatNaira } from "@/components/common"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BankTransferCard } from "@/components/BankTransferCard"
import { PaymentMethodDialog, type Gateway } from "@/components/PaymentMethodDialog"
import { SUBSCRIBE_ENABLED } from "@/lib/featureFlags"
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

  // Page-lifetime bookkeeping: stop polling if the student leaves, and never announce one payment twice
  // (the Squad pop-up can report both "success" and "closed" for the same payment).
  const mounted = useRef(true)
  const inFlight = useRef(new Set<string>())
  const announced = useRef(new Set<string>())
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  // The gateways return to this page in different shapes: Paystack adds ?reference=..., and Squad's pop-up
  // (after a successful payment) or hosted page sends the browser to ...?reference=... too, while our own
  // hosted-page link uses ?provider=squad&ref=.... So never trust the parameter name: our Squad payment
  // references start with "MHSQ", Paystack's with "MHUB_". Capture once, up front, so React re-running
  // effects can't lose it.
  const returned = useRef(
    (() => {
      const ref = params.get("provider") === "squad" ? params.get("ref") ?? params.get("reference") : params.get("reference")
      const isSquad = params.get("provider") === "squad" || (ref?.startsWith("MHSQ") ?? false)
      return { squadRef: isSquad ? ref : null, paystackRef: isSquad ? null : ref }
    })(),
  )

  /** Ask our server whether a Paystack payment went through (it checks with Paystack itself). */
  async function confirmPaystack(reference: string) {
    const toastId = toast.loading("Confirming your payment…")
    try {
      const r = await api.get<SubscriptionStatusResponse>(`/student/subscription/verify/${reference}`)
      if (r.data.active) toast.success("Subscription activated!", { id: toastId })
      else toast.message("Payment received — activation pending.", { id: toastId })
      status.reload()
    } catch (e) {
      toast.error(errorMessage(e), { id: toastId })
    }
  }

  /**
   * Ask our server whether a Squad payment went through. Squad confirms asynchronously, so keep asking for a
   * short while; the server also settles it on its own (webhook + background sweep) if we give up first.
   * `quiet` is used when the pop-up is closed: a few silent checks, and a message only if it was paid.
   */
  async function confirmSquad(ref: string, quiet = false) {
    if (inFlight.current.has(ref) || announced.current.has(ref)) return
    inFlight.current.add(ref)
    const toastId = quiet ? undefined : toast.loading("Confirming your payment with Squad…")
    const attempts = quiet ? 3 : 6
    const gap = quiet ? 2000 : 4000
    try {
      for (let attempt = 0; attempt < attempts; attempt++) {
        if (!mounted.current) {
          if (toastId !== undefined) toast.dismiss(toastId) // never leave a spinner behind
          return
        }
        const r = await api.get<PaymentVerificationResponse>(`/student/subscription/squad/verify/${ref}`)
        if (r.data.outcome === "PAID") {
          announced.current.add(ref)
          toast.success("Payment confirmed — your subscription is active!", { id: toastId })
          status.reload()
          return
        }
        if (r.data.outcome === "FAILED") {
          announced.current.add(ref)
          if (!quiet) toast.error("Squad reported that this payment didn't go through. No subscription time was added.", { id: toastId })
          return
        }
        if (attempt < attempts - 1) await pause(gap)
      }
      if (!quiet) {
        toast.message(
          "We haven't received confirmation yet. If you completed the payment, your subscription will activate automatically within a few minutes.",
          { id: toastId, duration: 10000 },
        )
      }
      if (mounted.current) status.reload()
    } catch (e) {
      if (!quiet) toast.error(errorMessage(e), { id: toastId })
    } finally {
      inFlight.current.delete(ref)
    }
  }

  // Returning from a full-page checkout (the fallback when a pop-up can't open).
  useEffect(() => {
    const reference = returned.current.paystackRef
    if (!reference) return
    void confirmPaystack(reference).finally(() => {
      params.delete("reference")
      setParams(params, { replace: true })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const ref = returned.current.squadRef
    if (!ref) return
    void confirmSquad(ref)
    const returnKeys = ["provider", "ref", "reference", "trxref"]
    if (returnKeys.some((key) => params.has(key))) {
      returnKeys.forEach((key) => params.delete(key))
      setParams(params, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Every checkout start gets a number. If the student closes the chooser while one is still starting, the
  // number moves on, and the late result is dropped: no pop-up opens and no redirect happens behind their back.
  const attempt = useRef(0)
  const CHECKOUT_TIMEOUT_MS = 30000

  /** The student dismissed the chooser (the x, Esc, or a click outside): cancel whatever is starting. */
  function onChooserOpenChange(open: boolean) {
    setChooserOpen(open)
    if (!open) {
      attempt.current += 1
      setStarting(false)
      setStartingSquad(false)
    }
  }

  /** Close our chooser and give it a moment to release focus and scrolling, so a provider pop-up can take over. */
  async function closeChooser() {
    setChooserOpen(false)
    await pause(300)
  }

  async function payWithPaystack() {
    const mine = ++attempt.current
    setStarting(true)
    try {
      const res = await api.post<InitializeSubscriptionResponse>("/student/subscription/initialize", null, { timeout: CHECKOUT_TIMEOUT_MS })
      if (attempt.current !== mine) return // the student closed the chooser while this was starting
      const { authorizationUrl, accessCode, reference } = res.data
      if (accessCode) {
        try {
          await closeChooser()
          if (attempt.current !== mine) return
          await openPaystackPopup(accessCode, {
            onSuccess: (ref) => void confirmPaystack(ref || reference),
            onCancel: () => toast.message("Payment cancelled. You haven't been charged."),
            onError: (message) => toast.error(message),
          })
          setStarting(false)
          return
        } catch {
          // the pop-up couldn't open (blocked or offline): carry on to Paystack's own page
        }
      }
      if (attempt.current !== mine) return
      window.location.href = authorizationUrl
    } catch (e) {
      if (attempt.current !== mine) return
      toast.error(errorMessage(e, "Could not start checkout. Please try again."))
      setStarting(false)
    }
  }

  async function payWithSquad() {
    const mine = ++attempt.current
    setStartingSquad(true)
    try {
      if (options.data?.squadInline) {
        const { data: session } = await api.post<SquadCheckoutSession>("/student/subscription/squad/prepare", null, { timeout: CHECKOUT_TIMEOUT_MS })
        if (attempt.current !== mine) return // the student closed the chooser while this was starting
        try {
          await closeChooser()
          if (attempt.current !== mine) return
          await openSquadModal(session, {
            onSuccess: () => void confirmSquad(session.reference),
            onClose: () => void confirmSquad(session.reference, true),
          })
          setStartingSquad(false)
          return
        } catch {
          // the pop-up couldn't open (blocked or offline): carry on to Squad's own page
        }
      }
      if (attempt.current !== mine) return
      const res = await api.post<InitializeSubscriptionResponse>("/student/subscription/squad/initialize", null, { timeout: CHECKOUT_TIMEOUT_MS })
      if (attempt.current !== mine) return
      window.location.href = res.data.authorizationUrl
    } catch (e) {
      if (attempt.current !== mine) return
      toast.error(errorMessage(e, "Could not start checkout. Please try again."))
      setStartingSquad(false)
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
  const available: Record<Gateway, boolean> = { paystack: paystackOn, squad: squadOn }
  // A student whose Paystack subscription still auto-renews is already covered, so there is nothing to pay.
  // Everyone else can pay or extend, and is always asked which provider to use.
  const canPay = !autoRenewing && (paystackOn || squadOn)
  const busyGateway: Gateway | null = starting ? "paystack" : startingSquad ? "squad" : null

  function startCheckout(gateway: Gateway) {
    return gateway === "paystack" ? payWithPaystack() : payWithSquad()
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
                className="mt-6 w-full disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
                onClick={() => { if (SUBSCRIBE_ENABLED) setChooserOpen(true) }}
                disabled={!SUBSCRIBE_ENABLED || !canPay || busyGateway != null}
              >
                {busyGateway != null && <Loader2 className="mr-2 size-4 animate-spin" />}
                {!canPay && s.active
                  ? "Subscribed"
                  : s.active
                    ? `Extend ${p.intervalDays} days`
                    : "Subscribe"}
              </Button>

              {!s.active && !canPay && (
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

      <BankTransferCard priceKobo={p?.priceKobo} />
      </div>

      {p && (
        <PaymentMethodDialog
          open={chooserOpen}
          onOpenChange={onChooserOpenChange}
          available={available}
          busy={busyGateway}
          onChoose={(g) => void startCheckout(g)}
        />
      )}
    </>
  )
}
