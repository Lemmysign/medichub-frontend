import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import type { InitializeSubscriptionResponse, SubscriptionPlanResponse, SubscriptionStatusResponse } from "@/lib/types"
import { PageHeader, CenteredSpinner, ErrorState, formatNaira } from "@/components/common"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Loader2 } from "lucide-react"

export function SubscriptionPage() {
  const [params, setParams] = useSearchParams()
  const status = useApi(() => api.get<SubscriptionStatusResponse>("/student/subscription").then((r) => r.data), [])
  const plan = useApi(() => api.get<SubscriptionPlanResponse>("/public/subscription-plan").then((r) => r.data).catch(() => null), [])
  const [starting, setStarting] = useState(false)

  // Handle the Paystack callback (?reference=...) after checkout.
  useEffect(() => {
    const reference = params.get("reference")
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

  if (status.loading) return <CenteredSpinner />
  if (status.error) return <ErrorState message={status.error} />
  const s = status.data!
  const p = plan.data

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
                {s.planName} • renews/expires {s.endDate ? new Date(s.endDate).toLocaleDateString() : "—"}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <p className="mb-6 text-sm text-muted-foreground">
          Status: <Badge variant="secondary">{s.status ?? "None"}</Badge>
        </p>
      )}

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
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /> Access to all courses</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /> All mock tests & materials</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /> Progress tracking & Q&A</li>
              </ul>
              <Button className="mt-6 w-full" onClick={subscribe} disabled={starting || s.active}>
                {starting && <Loader2 className="mr-2 size-4 animate-spin" />}
                {s.active ? "Subscribed" : "Subscribe with Paystack"}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No plan is configured yet. Please check back soon.</p>
          )}
        </CardContent>
      </Card>
    </>
  )
}
