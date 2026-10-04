import { Link } from "react-router-dom"
import { CheckCircle2, Lock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export type LockedFeature = "mcqs" | "recalls" | "mock"

const COPY: Record<LockedFeature, { eyebrow: string; title: string; text: string; bullets: string[] }> = {
  mcqs: {
    eyebrow: "MCQ bank",
    title: "Practise like the real exam. Pass with confidence.",
    text: "Build speed and accuracy, one question at a time.",
    bullets: [
      "Question sets you can practise any time, on any device",
      "Every answer explained, so you learn why",
      "Go at your own pace and repeat as often as you like",
    ],
  },
  recalls: {
    eyebrow: "Past-question recalls",
    title: "Study what candidates actually remember.",
    text: "See the kind of questions that have really come up, before you sit the exam.",
    bullets: [
      "Real questions recalled from past sittings",
      "The correct answer, explained",
      "Picture-based questions included",
    ],
  },
  mock: {
    eyebrow: "Mock exams",
    title: "Sit the exam before exam day.",
    text: "Find out where you stand while there is still time to improve.",
    bullets: [
      "Full timed papers that feel like the real thing",
      "Marked instantly, with the correct answers shown",
      "Every attempt saved, so you can watch your score climb",
    ],
  },
}

/**
 * Shown instead of a red error when a student without an active subscription opens a subscriber-only section
 * (the API answers 402). It is meant to encourage, not just refuse: what they get, and one clear next step.
 */
export function SubscriptionLocked({ feature }: { feature: LockedFeature }) {
  const c = COPY[feature]
  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="grid md:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col justify-center p-6 sm:p-9">
          <span className="font-700 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-widest text-primary">
            <Lock className="size-3.5" /> {c.eyebrow} · for subscribers
          </span>
          <h2 className="font-800 mt-4 text-2xl leading-tight tracking-tight sm:text-3xl">{c.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{c.text}</p>

          <ul className="mt-5 space-y-2.5">
            {c.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="mt-0.5 size-[18px] shrink-0 text-success" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7">
            <Button asChild size="lg" className="font-700 w-full sm:w-auto">
              <Link to="/student/subscription"><Sparkles className="mr-2 size-4" /> See subscription options</Link>
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              Already paid by bank transfer? Your access starts once we confirm your payment.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center bg-gradient-to-br from-primary to-[#0e7a75] p-6 sm:p-9">
          <UnlockIllustration />
        </div>
      </div>
    </Card>
  )
}

/** An opening padlock, rising scores and a pass badge. Pure SVG, so it needs no image file. */
function UnlockIllustration() {
  return (
    <svg viewBox="0 0 480 330" role="img" aria-label="An unlocked padlock beside rising scores and a pass badge" className="h-auto w-full max-w-md">
      <circle cx="240" cy="165" r="150" className="fill-white/10" />
      <circle cx="240" cy="165" r="104" className="fill-white/10" />

      {/* rising scores */}
      <g>
        <rect x="52" y="190" width="30" height="62" rx="6" className="fill-white/35" />
        <rect x="92" y="156" width="30" height="96" rx="6" className="fill-white/60" />
        <rect x="132" y="116" width="30" height="136" rx="6" className="fill-white/90" />
        <path d="M60 176 L106 142 L148 98" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="stroke-[#99f2eb]" />
        <path d="M134 96 L150 96 L150 112" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="stroke-[#99f2eb]" />
      </g>

      {/* opening padlock */}
      <g>
        <path d="M214 160 V128 a30 30 0 0 1 56 -14" fill="none" strokeWidth="14" strokeLinecap="round" className="stroke-white" />
        <rect x="196" y="156" width="104" height="88" rx="18" className="fill-white" />
        <circle cx="248" cy="192" r="10" className="fill-primary" />
        <rect x="243" y="196" width="10" height="24" rx="5" className="fill-primary" />
      </g>

      {/* pass badge */}
      <circle cx="388" cy="96" r="34" className="fill-success" />
      <path d="M372 97 l11 11 l21 -23" fill="none" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" className="stroke-white" />

      {/* progress card */}
      <rect x="338" y="180" width="108" height="62" rx="12" className="fill-white/95" />
      <rect x="352" y="196" width="80" height="9" rx="4.5" className="fill-primary/20" />
      <rect x="352" y="196" width="62" height="9" rx="4.5" className="fill-success" />
      <rect x="352" y="216" width="56" height="9" rx="4.5" className="fill-primary/20" />

      {/* sparkles */}
      <g className="fill-warning">
        <path d="M110 66 l5 14 l14 5 l-14 5 l-5 14 l-5 -14 l-14 -5 l14 -5 z" />
        <path d="M352 268 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 z" />
        <path d="M300 56 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 z" />
      </g>
    </svg>
  )
}
