import { cn } from "@/lib/utils"

/** The MedicHub Academy brand mark (a square image), used everywhere a logo icon is needed. */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo-192.png"
      alt="MedicHub Academy"
      width={size}
      height={size}
      className={cn("shrink-0 rounded-lg object-cover", className)}
      style={{ width: size, height: size }}
    />
  )
}
