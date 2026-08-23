// Types mirroring the MedicHub backend DTOs.

export type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN"
export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE"
export type SubscriptionStatus = "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED"

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
  orderIndex: number
  options: OptionResponse[]
}
export interface TestResponse {
  id: number
  courseId: number
  title: string
  passMarkPercent: number
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
  questions: StudentQuestionResponse[]
}
export interface AttemptAnswerResponse {
  questionId: number
  questionText: string
  selectedOptionId: number | null
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
  topicId: number | null
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

export interface MockExamResponse {
  id: number
  title: string
  description: string | null
  passMarkPercent: number
  durationMinutes: number | null
  published: boolean
  ownerName: string | null
  questionCount: number
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
}

export interface MockExamStartResponse {
  attemptId: number
  mockExamId: number
  title: string
  passMarkPercent: number
  durationMinutes: number | null
  startedAt: string
  expiresAt: string
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

export interface ApiError {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
  fieldErrors?: { field: string; message: string }[]
}
