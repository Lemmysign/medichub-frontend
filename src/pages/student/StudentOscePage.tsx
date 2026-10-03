import { ClipboardCheck, Stethoscope, Sparkles } from "lucide-react"
import { ComingSoon } from "@/components/ComingSoon"

const PLANNED = [
  { icon: Stethoscope, title: "Practise clinical stations", text: "Work through the kind of hands-on stations you will meet on exam day." },
  { icon: ClipboardCheck, title: "Know what examiners look for", text: "Step-by-step checklists so you can see how each station is marked." },
  { icon: Sparkles, title: "Walkthroughs and tips", text: "Clear guidance on approach, communication and common mistakes." },
]

/** Student-side OSCE — a placeholder while the section is being built. */
export function StudentOscePage() {
  return (
    <ComingSoon
      pageTitle="OSCE"
      pageDescription="Objective Structured Clinical Examination — the practical, station-based part of the exam."
      title="We are working on the OSCE section"
      message="This section is still being put together. Check back soon, it will be added here as soon as it is ready."
      items={PLANNED}
      illustration={<OsceIllustration />}
    />
  )
}

/** Stethoscope + marking checklist. Pure SVG so it needs no image file and follows the light/dark theme. */
function OsceIllustration() {
  return (
    <svg viewBox="0 0 480 330" role="img" aria-label="A stethoscope beside an examiner's checklist" className="h-auto w-full max-w-md">
      {/* soft background discs */}
      <circle cx="240" cy="160" r="148" className="fill-primary/10" />
      <circle cx="240" cy="160" r="104" className="fill-primary/10" />

      {/* heartbeat line */}
      <path d="M24 296 H150 l14 -30 l20 60 l16 -30 H456" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-primary/45" />

      {/* checklist clipboard */}
      <g>
        <rect x="252" y="62" width="156" height="206" rx="16" className="fill-card stroke-border" strokeWidth="2" />
        <rect x="298" y="48" width="64" height="26" rx="9" className="fill-primary" />
        <circle cx="330" cy="61" r="4" className="fill-card" />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <circle cx="282" cy={116 + i * 42} r="12" className="fill-success" />
            <path d={`M276 ${116 + i * 42} l5 5 l9 -10`} fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="stroke-success-foreground" />
            <rect x="304" y={111 + i * 42} width={i === 1 ? 70 : 84} height="9" rx="4.5" className="fill-muted-foreground/25" />
          </g>
        ))}
        <circle cx="282" cy="242" r="11" fill="none" strokeWidth="2.5" className="stroke-muted-foreground/40" />
        <rect x="304" y="237" width="60" height="9" rx="4.5" className="fill-muted-foreground/25" />
      </g>

      {/* stethoscope */}
      <g fill="none" strokeWidth="8" strokeLinecap="round" className="stroke-primary">
        <path d="M92 64 C92 126 134 126 134 156" />
        <path d="M176 64 C176 126 134 126 134 156" />
        <path d="M134 156 V186 C134 222 196 206 196 214" />
      </g>
      <circle cx="92" cy="58" r="8" className="fill-foreground/80" />
      <circle cx="176" cy="58" r="8" className="fill-foreground/80" />
      <circle cx="196" cy="242" r="28" strokeWidth="8" className="fill-card stroke-primary" />
      <circle cx="196" cy="242" r="11" className="fill-primary" />

      {/* medical cross badge */}
      <circle cx="404" cy="70" r="27" className="fill-success" />
      <path d="M404 56 V84 M390 70 H418" fill="none" strokeWidth="8" strokeLinecap="round" className="stroke-success-foreground" />
    </svg>
  )
}
