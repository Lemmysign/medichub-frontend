import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export interface ConfirmOptions {
  /** Defaults to "Are you sure?". */
  title?: string
  /** The message body — usually the question being confirmed. */
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Red "destructive" styling for the confirm button — use for deletes. Defaults to true. */
  destructive?: boolean
}

type ConfirmFn = (description: string, options?: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

/**
 * App-wide replacement for the browser's native `window.confirm` (which renders as an ugly,
 * unstyled "<origin> says" dialog). Mount once near the app root; call {@link useConfirm} from
 * any component to get an async `confirm(message)` function that resolves to `true`/`false`.
 */
export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions & { description: string }>({ description: "" })
  const resolver = useRef<(value: boolean) => void>(() => {})

  const confirm = useCallback<ConfirmFn>((description, opts) => {
    setOptions({ description, ...opts })
    setOpen(true)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  function settle(value: boolean) {
    setOpen(false)
    resolver.current(value)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={open} onOpenChange={(o) => { if (!o) settle(false) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options.title ?? "Are you sure?"}</AlertDialogTitle>
            <AlertDialogDescription>{options.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => settle(false)}>{options.cancelLabel ?? "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => settle(true)}
              className={options.destructive === false ? undefined : "bg-destructive text-white hover:bg-destructive/90"}
            >
              {options.confirmLabel ?? "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  )
}

/** Returns an async `confirm(message, options?) => Promise<boolean>` — a styled `window.confirm` replacement. */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error("useConfirm must be used within a ConfirmDialogProvider")
  return ctx
}
