import { Link } from "react-router-dom"
import { CourseCatalog } from "@/components/CourseCatalog"
import { Button } from "@/components/ui/button"

export function LandingPage() {
  return (
    <>
      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Master medicine with expert-led courses
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            One subscription unlocks every course, mock test, and study material on MedicHub Academy —
            built for medical professionals and exam candidates.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/register">Start learning</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-xl font-semibold">Explore courses</h2>
        <CourseCatalog />
      </section>
    </>
  )
}
