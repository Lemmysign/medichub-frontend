import { useState } from "react"
import { cn } from "@/lib/utils"

/** Where the official Squad logo file lives (put it in public/gateways/). */
export const SQUAD_LOGO_SRC = "/gateways/squad-logo.png"

/**
 * The Squad logo. If the logo file is not there yet (or cannot load), it shows the plain name "Squad"
 * so the card never has a broken-image icon.
 */
export function SquadLogo({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return <span className={cn("font-800 tracking-tight text-foreground", className)}>Squad</span>
  }
  return <img src={SQUAD_LOGO_SRC} alt="Squad" onError={() => setFailed(true)} className={cn("object-contain", className)} />
}
