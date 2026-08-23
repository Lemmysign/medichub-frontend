import { useEffect, useState } from "react"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import { PageHeader, CenteredSpinner, ErrorState } from "@/components/common"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface AdminPlan {
  configured: boolean
  name: string | null
  priceNaira: number | null
  intervalDays: number | null
}

export function AdminPlanPage() {
  const { data, loading, error, reload } = useApi(() => api.get<AdminPlan>("/admin/subscription-plan").then((r) => r.data), [])
  const [form, setForm] = useState({ name: "", priceNaira: "", intervalDays: "30" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name ?? "MedicHub Academy Subscription",
        priceNaira: data.priceNaira != null ? String(data.priceNaira) : "",
        intervalDays: data.intervalDays != null ? String(data.intervalDays) : "30",
      })
    }
  }, [data])

  async function save() {
    setSaving(true)
    try {
      await api.put("/admin/subscription-plan", {
        name: form.name,
        priceNaira: Number(form.priceNaira),
        intervalDays: Number(form.intervalDays),
      })
      toast.success("Plan saved")
      reload()
    } catch (e) { toast.error(errorMessage(e)) } finally { setSaving(false) }
  }

  if (loading) return <CenteredSpinner />
  if (error) return <ErrorState message={error} />

  return (
    <>
      <PageHeader title="Subscription plan" description="Set the price (in Naira) and billing interval" />
      <Card className="max-w-md">
        <CardHeader><CardTitle>{data?.configured ? "Edit plan" : "Create plan"}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Plan name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="space-y-2">
            <Label>Price (₦ Naira)</Label>
            <Input type="number" min={1} value={form.priceNaira} onChange={(e) => setForm({ ...form, priceNaira: e.target.value })} placeholder="10000" />
          </div>
          <div className="space-y-2">
            <Label>Billing interval (days)</Label>
            <Input type="number" min={1} value={form.intervalDays} onChange={(e) => setForm({ ...form, intervalDays: e.target.value })} />
          </div>
          <Button onClick={save} disabled={saving || !form.name.trim() || !form.priceNaira}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />} Save plan
          </Button>
        </CardContent>
      </Card>
    </>
  )
}
