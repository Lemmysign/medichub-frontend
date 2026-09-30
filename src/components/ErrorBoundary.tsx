import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Last-resort fallback for uncaught render errors anywhere in the tree. Without this, a crash
 * in any component leaves the user staring at a blank white page with no explanation — this
 * shows a friendly full-page message instead, with a way to recover.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled render error:", error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="w-full max-w-md rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-6" />
            </div>
            <h1 className="font-700 text-lg">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              An unexpected error occurred. Try reloading the page — if it keeps happening, please let us know.
            </p>
            <Button className="mt-6" onClick={() => { this.setState({ error: null }); location.reload() }}>
              <RotateCcw className="mr-2 size-4" /> Reload page
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
