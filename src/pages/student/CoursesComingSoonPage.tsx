import { BookOpenCheck, Clapperboard, Stethoscope } from "lucide-react"
import { ComingSoon } from "@/components/ComingSoon"

const PLANNED = [
  { icon: Stethoscope, title: "Taught by practising doctors", text: "Every lesson is recorded by the doctors who run this platform." },
  { icon: Clapperboard, title: "Short, focused video lessons", text: "Watch at your own pace and pick up where you left off." },
  { icon: BookOpenCheck, title: "Notes and tests with each course", text: "Course materials and practice tests sit alongside the videos." },
]

/**
 * Shown for Browse Courses and My Courses while the course videos are still being recorded.
 * Switch it off with COURSES_READY in lib/featureFlags.ts.
 */
export function CoursesComingSoonPage({ variant }: { variant: "browse" | "mine" }) {
  const browse = variant === "browse"
  return (
    <ComingSoon
      pageTitle={browse ? "Browse Courses" : "My Courses"}
      pageDescription={browse ? "Video courses from the MedicHub Academy doctors." : "The courses you are learning, with your progress."}
      title="Video lessons are on the way"
      message={browse
        ? "Our doctors are still recording the course videos. We will upload the lessons shortly, so please stay in touch and check back soon."
        : "Our doctors are still recording the course videos. Once the lessons are uploaded, the courses you open will appear here with your progress. Please stay in touch."}
      items={PLANNED}
      illustration={<LessonsIllustration />}
    />
  )
}

/** A video player beside a lesson list. Pure SVG so it needs no image file and follows the light/dark theme. */
function LessonsIllustration() {
  return (
    <svg viewBox="0 0 480 330" role="img" aria-label="A video player beside a list of lessons" className="h-auto w-full max-w-md">
      <circle cx="240" cy="165" r="148" className="fill-primary/10" />
      <circle cx="240" cy="165" r="104" className="fill-primary/10" />

      {/* video player */}
      <g>
        <rect x="44" y="52" width="296" height="196" rx="18" className="fill-card stroke-border" strokeWidth="2" />
        <rect x="60" y="68" width="264" height="124" rx="11" className="fill-primary" />
        <circle cx="192" cy="130" r="30" className="fill-card" />
        <path d="M184 114 L184 146 L210 130 Z" className="fill-primary" strokeLinejoin="round" />
        <rect x="60" y="208" width="264" height="8" rx="4" className="fill-muted-foreground/25" />
        <rect x="60" y="208" width="112" height="8" rx="4" className="fill-primary" />
        <circle cx="172" cy="212" r="8" className="fill-primary stroke-card" strokeWidth="3" />
        <circle cx="68" cy="232" r="4" className="fill-muted-foreground/40" />
        <rect x="80" y="229" width="60" height="6" rx="3" className="fill-muted-foreground/25" />
      </g>

      {/* lesson list */}
      <g>
        <rect x="262" y="150" width="174" height="140" rx="14" className="fill-card stroke-border" strokeWidth="2" />
        <circle cx="288" cy="182" r="11" className="fill-success" />
        <path d="M282.5 182 l4 4 l8 -9" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="stroke-success-foreground" />
        <rect x="308" y="177" width="104" height="9" rx="4.5" className="fill-muted-foreground/25" />
        <circle cx="288" cy="220" r="11" className="fill-primary" />
        <path d="M285 214.5 L285 225.5 L294 220 Z" className="fill-card" />
        <rect x="308" y="215" width="82" height="9" rx="4.5" className="fill-muted-foreground/25" />
        <circle cx="288" cy="258" r="11" fill="none" strokeWidth="2.5" className="stroke-muted-foreground/40" />
        <rect x="308" y="253" width="96" height="9" rx="4.5" className="fill-muted-foreground/25" />
      </g>

      {/* medical cross badge */}
      <circle cx="336" cy="60" r="27" className="fill-success" />
      <path d="M336 46 V74 M322 60 H350" fill="none" strokeWidth="8" strokeLinecap="round" className="stroke-success-foreground" />
    </svg>
  )
}
