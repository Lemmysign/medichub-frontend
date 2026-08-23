import { CourseCatalog } from "@/components/CourseCatalog"
import { PageHeader } from "@/components/common"

export function BrowsePage() {
  return (
    <>
      <PageHeader title="Browse courses" description="Everything included with your subscription" />
      <CourseCatalog />
    </>
  )
}
