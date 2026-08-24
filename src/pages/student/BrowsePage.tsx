import { CourseCatalog } from "@/components/CourseCatalog"
import { PageHeader } from "@/components/common"

export function BrowsePage() {
  return (
    <>
      <PageHeader title="Browse Courses" description="All courses included with your subscription — explore and enrol instantly." />
      <CourseCatalog showSearch hrefFor={(id) => `/student/courses/${id}`} />
    </>
  )
}
