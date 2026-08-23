import { Routes, Route, Navigate } from "react-router-dom"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { AppLayout } from "@/components/layout/AppLayout"
import { PublicLayout } from "@/components/layout/PublicLayout"

import { LoginPage } from "@/pages/auth/LoginPage"
import { RegisterPage } from "@/pages/auth/RegisterPage"
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage"
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage"

import { LandingPage } from "@/pages/public/LandingPage"
import { CoursePreviewPage } from "@/pages/public/CoursePreviewPage"

import { StudentDashboardPage } from "@/pages/student/StudentDashboardPage"
import { BrowsePage } from "@/pages/student/BrowsePage"
import { MyCoursesPage } from "@/pages/student/MyCoursesPage"
import { CoursePlayerPage } from "@/pages/student/CoursePlayerPage"
import { SubscriptionPage } from "@/pages/student/SubscriptionPage"

import { InstructorDashboardPage } from "@/pages/instructor/InstructorDashboardPage"
import { InstructorCoursesPage } from "@/pages/instructor/InstructorCoursesPage"
import { InstructorCourseManagePage } from "@/pages/instructor/InstructorCourseManagePage"
import { InstructorQuestionsPage } from "@/pages/instructor/InstructorQuestionsPage"

import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage"
import { AdminUsersPage } from "@/pages/admin/AdminUsersPage"
import { AdminPlanPage } from "@/pages/admin/AdminPlanPage"
import { AdminSettingsPage } from "@/pages/admin/AdminSettingsPage"

import { AccountPage } from "@/pages/account/AccountPage"

function App() {
  return (
    <Routes>
      {/* Auth (no chrome) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/courses/:id" element={<CoursePreviewPage />} />
      </Route>

      {/* Any authenticated user */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/account" element={<AccountPage />} />
        </Route>
      </Route>

      {/* Student */}
      <Route element={<ProtectedRoute roles={["STUDENT"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/student" element={<StudentDashboardPage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/student/courses" element={<MyCoursesPage />} />
          <Route path="/student/courses/:id" element={<CoursePlayerPage />} />
          <Route path="/student/subscription" element={<SubscriptionPage />} />
        </Route>
      </Route>

      {/* Instructor */}
      <Route element={<ProtectedRoute roles={["INSTRUCTOR"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/instructor" element={<InstructorDashboardPage />} />
          <Route path="/instructor/courses" element={<InstructorCoursesPage />} />
          <Route path="/instructor/courses/:id" element={<InstructorCourseManagePage />} />
          <Route path="/instructor/questions" element={<InstructorQuestionsPage />} />
        </Route>
      </Route>

      {/* Admin */}
      <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/plan" element={<AdminPlanPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
