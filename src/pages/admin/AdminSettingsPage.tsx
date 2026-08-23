import { useState } from "react"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import { PageHeader, CenteredSpinner, ErrorState } from "@/components/common"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Settings {
  videoDownloadEnabled: boolean
}

export function AdminSettingsPage() {
  const { data, loading, error, reload } = useApi(() => api.get<Settings>("/admin/settings").then((r) => r.data), [])
  const [saving, setSaving] = useState(false)

  async function toggle() {
    if (!data) return
    setSaving(true)
    try {
      await api.put("/admin/settings/video-download", { videoDownloadEnabled: !data.videoDownloadEnabled })
      toast.success("Settings updated")
      reload()
    } catch (e) { toast.error(errorMessage(e)) } finally { setSaving(false) }
  }

  if (loading) return <CenteredSpinner />
  if (error) return <ErrorState message={error} />

  return (
    <>
      <PageHeader title="Platform settings" description="Global controls" />
      <Card className="flex max-w-lg items-center justify-between p-5">
        <div>
          <p className="font-medium">Allow video downloads</p>
          <p className="text-sm text-muted-foreground">
            When on, students can download course videos. Off by default.
          </p>
        </div>
        <Button variant={data?.videoDownloadEnabled ? "default" : "outline"} onClick={toggle} disabled={saving}>
          {data?.videoDownloadEnabled ? "Enabled" : "Disabled"}
        </Button>
      </Card>
    </>
  )
}
