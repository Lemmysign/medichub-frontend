// Types mirroring the MedicHub backend DTOs.

export type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN"
export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE"
/** MCQ = subject-tagged practice exam; RECALL = past questions tagged with subject + year. */
export type TestKind = "MCQ" | "RECALL"
export type SubscriptionStatus = "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED"
/** IMMEDIATE = reveal the answer + explanation as the student answers (study mode).
 *  ON_SUBMISSION = reveal only after the whole test/exam is submitted (exam mode). */
export type FeedbackMode = "IMMEDIATE" | "ON_SUBMISSION"

export interface UserResponse {
  id: number
  fullName: string
  email: string
  phone: string | null
  role: Role
  enabled: boolean
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresInSeconds: number
  user: UserResponse
}

/** Register/resend result — an unverified account; the SPA shows the OTP screen. */
export interface OtpChallengeResponse {
  email: string
  message: string
}

/** Verify-OTP result — either logged in (auth set) or a verified instructor awaiting approval. */
export interface VerifyOtpResponse {
  pendingApproval: boolean
  auth: AuthResponse | null
}

/** An instructor awaiting admin approval, for the admin approvals queue. */
export interface PendingInstructorResponse {
  id: number
  fullName: string
  email: string
  phone: string | null
  emailVerified: boolean
  registeredAt: string
}

export interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface CourseResponse {
  id: number
  title: string
  description: string | null
  thumbnailUrl: string | null
  published: boolean
  instructorId: number
  instructorName: string
  topicCount: number
  createdAt: string
  updatedAt: string
}

export interface TopicPreviewResponse {
  id: number
  title: string
  orderIndex: number
  videoDurationSeconds: number | null
  hasVideo: boolean
}

export interface CoursePreviewResponse {
  id: number
  title: string
  description: string | null
  thumbnailUrl: string | null
  published: boolean
  instructorId: number
  instructorName: string
  topicCount: number
  topics: TopicPreviewResponse[]
}

export interface TopicResponse {
  id: number
  title: string
  orderIndex: number
  bunnyVideoId: string | null
  videoDurationSeconds: number | null
  hasVideo: boolean
}

export interface EnrolledCourseResponse {
  courseId: number
  title: string
  thumbnailUrl: string | null
  instructorName: string
  totalTopics: number
  completedTopics: number
  percentComplete: number
  enrolledAt: string
  lastAccessedAt: string | null
}

export interface CourseProgressResponse {
  courseId: number
  totalTopics: number
  completedTopics: number
  percentComplete: number
}

export interface VideoPlaybackResponse {
  topicId: number
  bunnyVideoId: string
  playbackUrl: string
  expiresInSeconds: number
  downloadEnabled: boolean
  downloadUrl: string | null
}

export interface MaterialResponse {
  id: number
  fileName: string
  contentType: string | null
  sizeBytes: number | null
  topicId: number | null
  createdAt: string
}

export interface OptionResponse {
  id: number
  text: string
  correct: boolean
  orderIndex: number
}
export interface QuestionResponse {
  id: number
  text: string
  type: QuestionType
  explanation: string | null
  orderIndex: number
  options: OptionResponse[]
}
export interface TestResponse {
  id: number
  courseId: number
  title: string
  passMarkPercent: number
  feedbackMode: FeedbackMode
  questionCount: number
}
export interface StudentOptionResponse {
  id: number
  text: string
  orderIndex: number
}
export interface StudentQuestionResponse {
  id: number
  text: string
  type: QuestionType
  orderIndex: number
  options: StudentOptionResponse[]
}
export interface StudentTestResponse {
  id: number
  courseId: number
  title: string
  passMarkPercent: number
  feedbackMode: FeedbackMode
  questions: StudentQuestionResponse[]
}
/** Immediate-mode per-question reveal. `timerPaused`/`expiresAt` only matter for timed mocks.
 *  `correctOptionIds` lists every correct option (for multiple-choice); `correctOptionId` is the first. */
export interface CheckAnswerResponse {
  questionId: number
  correct: boolean
  correctOptionId: number | null
  correctOptionIds: number[]
  explanation: string | null
  timerPaused: boolean
  expiresAt: string | null
}
export interface AttemptAnswerResponse {
  questionId: number
  questionText: string
  selectedOptionId: number | null
  correctOptionId: number | null
  correctOptionIds: number[]
  explanation: string | null
  correct: boolean
}
export interface AttemptResponse {
  id: number
  testId: number
  scorePercent: number
  passed: boolean
  startedAt: string
  submittedAt: string
}
export interface AttemptDetailResponse extends AttemptResponse {
  answers: AttemptAnswerResponse[]
}

export interface CommentResponse {
  id: number
  text: string
  authorId: number
  authorName: string
  authorRole: Role
  courseId: number
  courseTitle: string | null
  topicId: number | null
  topicTitle: string | null
  parentId: number | null
  answered: boolean
  createdAt: string
  replies: CommentResponse[]
}

export interface SubscriptionStatusResponse {
  active: boolean
  status: SubscriptionStatus | null
  planName: string | null
  startDate: string | null
  endDate: string | null
}

export interface SubscriptionPlanResponse {
  id: number
  name: string
  priceKobo: number
  currency: string
  intervalDays: number
}

export interface InitializeSubscriptionResponse {
  authorizationUrl: string
  accessCode: string
  reference: string
}

export interface SubjectResponse {
  id: number
  name: string
  slug: string
  orderIndex: number
  active: boolean
}

/** Student list-card view of a recall paper — click through to read its questions. */
export interface RecallSummaryResponse {
  id: number
  title: string
  description: string | null
  subjectName: string | null
  examYear: number | null
  questionCount: number
}

/** A single recall question for the student study view — answers revealed (view-only). */
export interface RecallQuestionResponse {
  id: number
  subjectName: string | null
  examYear: number | null
  sourceTitle: string | null
  text: string
  type: QuestionType
  explanation: string | null
  options: OptionResponse[]
}

export interface MockExamResponse {
  id: number
  title: string
  description: string | null
  passMarkPercent: number
  durationMinutes: number | null
  published: boolean
  feedbackMode: FeedbackMode
  ownerName: string | null
  questionCount: number
  kind: TestKind
  subjectId: number | null
  subjectName: string | null
  examYear: number | null
}

export interface MockExamSummaryResponse {
  id: number
  title: string
  description: string | null
  passMarkPercent: number
  durationMinutes: number | null
  questionCount: number
  bestScorePercent: number | null
  attemptCount: number
  kind: TestKind
  subjectId: number | null
  subjectName: string | null
  examYear: number | null
}

export interface MockExamStartResponse {
  attemptId: number
  mockExamId: number
  title: string
  passMarkPercent: number
  durationMinutes: number | null
  feedbackMode: FeedbackMode
  startedAt: string
  expiresAt: string | null
  questions: StudentQuestionResponse[]
}

export interface InstructorDashboardResponse {
  totalCourses: number
  totalStudentsEnrolled: number
  totalTests: number
  totalStudentsTested: number
}
export interface StudentDashboardResponse {
  coursesEnrolled: number
  testsTaken: number
  averageScorePercent: number
  coursesCompleted: number
}
export interface AdminMetricsResponse {
  totalInstructors: number
  totalStudents: number
  totalTests: number
  activeSubscriptions: number
}
export interface RevenueBucket {
  periodStart: string
  amountKobo: number
}
export interface RevenueReportResponse {
  granularity: string
  from: string
  to: string
  totalKobo: number
  buckets: RevenueBucket[]
}

export interface ApiError {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
  fieldErrors?: { field: string; message: string }[]
}
