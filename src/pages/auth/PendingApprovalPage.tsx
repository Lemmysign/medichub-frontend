import { Link } from "react-router-dom"
import { AuthShell } from "./AuthShell"
import { Button } from "@/components/ui/button"
import { Clock, ShieldCheck } from "lucide-react"

export function PendingApprovalPage() {
  return (
    <AuthShell
      title="Almost there"
      subtitle="Your email is verified. An admin now needs to approve your instructor account."
      quote={{
        text: "Teaching on MedicHub let me reach candidates across the country — all from one dashboard.",
        author: "Dr. Tunde Bakare",
        meta: "Instructor · Surgery",
        initials: "TB",
      }}
      footer={
        <>
          Already approved?{" "}
          <Link to="/login" className="font-700 text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-warning/30 bg-warning/5 p-6 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-warning/15 text-warning">
            <Clock className="size-6" />
          </span>
          <p className="font-700 text-lg">Awaiting admin approval</p>
          <p className="text-sm text-muted-foreground">
            Instructor accounts are reviewed before activation. You'll be able to sign in as soon as an
            admin approves you — we'll notify you by email.
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>This keeps the platform trusted — every instructor is vetted before they can publish content.</span>
        </div>

        <Button asChild className="font-700 w-full">
          <Link to="/login">Back to sign in</Link>
        </Button>
      </div>
    </AuthShell>
  )
}
