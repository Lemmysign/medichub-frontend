import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import { useAuth } from "@/context/AuthContext"
import type { InstructorDashboardResponse } from "@/lib/types"
import { PageHeader, StatCard, CenteredSpinner, ErrorState } from "@/components/common"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, FileQuestion, GraduationCap } from "lucide-react"

export function InstructorDashboardPage() {
  const { user } = useAuth()
  const { data, loading, error } = useApi(
    () => api.get<InstructorDashboardResponse>("/instructor/dashboard").then((r) => r.data),
    [],
  )
  if (loading) return <CenteredSpinner />
  if (error) return <ErrorState message={error} />
  const d = data!
  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.fullName.split(" ")[0]}`}
        description="Your teaching overview"
        action={
          <Button asChild>
            <Link to="/instructor/courses">Manage courses</Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Courses" value={d.totalCourses} icon={BookOpen} />
        <StatCard label="Students enrolled" value={d.totalStudentsEnrolled} icon={Users} />
        <StatCard label="Tests created" value={d.totalTests} icon={FileQuestion} />
        <StatCard label="Students tested" value={d.totalStudentsTested} icon={GraduationCap} />
      </div>
    </>
  )
}
