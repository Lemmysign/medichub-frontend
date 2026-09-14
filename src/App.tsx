import { Routes, Route, Navigate } from "react-router-dom"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { AppLayout } from "@/components/layout/AppLayout"

import { LoginPage } from "@/pages/auth/LoginPage"
import { AdminLoginPage } from "@/pages/auth/AdminLoginPage"
import { RegisterPage } from "@/pages/auth/RegisterPage"
import { VerifyEmailPage } from "@/pages/auth/VerifyEmailPage"
import { PendingApprovalPage } from "@/pages/auth/PendingApprovalPage"
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage"
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage"

import { StudentDashboardPage } from "@/pages/student/StudentDashboardPage"
import { BrowsePage } from "@/pages/student/BrowsePage"
import { MyCoursesPage } from "@/pages/student/MyCoursesPage"
import { CoursePlayerPage } from "@/pages/student/CoursePlayerPage"
import { TestTakePage } from "@/pages/student/TestTakePage"
import { SubscriptionPage } from "@/pages/student/SubscriptionPage"
import { StudentMockExamsPage } from "@/pages/student/StudentMockExamsPage"
import { StudentMcqListPage } from "@/pages/student/StudentMcqListPage"
import { StudentMcqPracticePage } from "@/pages/student/StudentMcqPracticePage"
import { StudentStudyListPage } from "@/pages/student/StudentStudyListPage"
import { StudentStudyViewPage } from "@/pages/student/StudentStudyViewPage"
import { StudyManagePage } from "@/pages/study/StudyManagePage"
import { StudentRecallsPage } from "@/pages/student/StudentRecallsPage"
import { StudentRecallViewPage } from "@/pages/student/StudentRecallViewPage"
import { MockExamRunPage } from "@/pages/student/MockExamRunPage"
import { MockExamsListPage } from "@/pages/mock/MockExamsListPage"
import { MockExamManagePage } from "@/pages/mock/MockExamManagePage"
import { RecallsListPage } from "@/pages/recall/RecallsListPage"

import { InstructorDashboardPage } from "@/pages/instructor/InstructorDashboardPage"
import { InstructorCoursesPage } from "@/pages/instructor/InstructorCoursesPage"
import { InstructorCourseManagePage } from "@/pages/instructor/InstructorCourseManagePage"
import { InstructorQuestionsPage } from "@/pages/instructor/InstructorQuestionsPage"

import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage"
import { AdminUsersPage } from "@/pages/admin/AdminUsersPage"
import { AdminApprovalsPage } from "@/pages/admin/AdminApprovalsPage"
import { AdminSubjectsPage } from "@/pages/admin/AdminSubjectsPage"
import { AdminPlanPage } from "@/pages/admin/AdminPlanPage"
import { AdminSettingsPage } from "@/pages/admin/AdminSettingsPage"

import { AccountPage } from "@/pages/account/AccountPage"

function App() {
  return (
    <Routes>
      {/* Auth (no chrome) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/pending-approval" element={<PendingApprovalPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Root → app entry. This is the app (app.medichubacademy.com); marketing lives on the
          separate Pass MDCN site. LoginPage bounces already-authenticated users to their dashboard. */}
      <Route path="/" element={<Navigate to="/login" replace />} />

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
          <Route path="/student/courses/:courseId/tests/:testId" element={<TestTakePage />} />
          <Route path="/student/mock-exams" element={<StudentMockExamsPage />} />
          <Route path="/student/mock-exams/:id" element={<MockExamRunPage />} />
          <Route path="/student/mcq" element={<StudentMcqListPage />} />
          <Route path="/student/mcq/:id" element={<StudentMcqPracticePage />} />
          <Route path="/student/study" element={<StudentStudyListPage />} />
          <Route path="/student/study/:id" element={<StudentStudyViewPage />} />
          <Route path="/student/recalls" element={<StudentRecallsPage />} />
          <Route path="/student/recalls/:id" element={<StudentRecallViewPage />} />
          <Route path="/student/subscription" element={<SubscriptionPage />} />
        </Route>
      </Route>

      {/* Instructor */}
      <Route element={<ProtectedRoute roles={["INSTRUCTOR"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/instructor" element={<InstructorDashboardPage />} />
          <Route path="/instructor/courses" element={<InstructorCoursesPage />} />
          <Route path="/instructor/courses/:id" element={<InstructorCourseManagePage />} />
          <Route path="/instructor/mock-exams" element={<MockExamsListPage />} />
          <Route path="/instructor/mock-exams/:id" element={<MockExamManagePage />} />
          <Route path="/instructor/recalls" element={<RecallsListPage basePath="/instructor/recalls" />} />
          <Route path="/instructor/recalls/:id" element={<MockExamManagePage basePath="recalls" kind="RECALL" />} />
          <Route path="/instructor/study" element={<StudyManagePage />} />
          <Route path="/instructor/questions" element={<InstructorQuestionsPage />} />
        </Route>
      </Route>

      {/* Admin */}
      <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/approvals" element={<AdminApprovalsPage />} />
          <Route path="/admin/mock-exams" element={<MockExamsListPage />} />
          <Route path="/admin/mock-exams/:id" element={<MockExamManagePage />} />
          <Route path="/admin/recalls" element={<RecallsListPage basePath="/admin/recalls" />} />
          <Route path="/admin/recalls/:id" element={<MockExamManagePage basePath="recalls" kind="RECALL" />} />
          <Route path="/admin/study" element={<StudyManagePage />} />
          <Route path="/admin/subjects" element={<AdminSubjectsPage />} />
          <Route path="/admin/plan" element={<AdminPlanPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
