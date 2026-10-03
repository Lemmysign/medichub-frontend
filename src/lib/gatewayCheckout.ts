import { loadScript } from "@/lib/loadScript"
import type { SquadCheckoutSession } from "@/lib/types"

/**
 * In-page payment pop-ups for Paystack and Squad, so the student never leaves the portal and the provider's
 * own pop-up has a close button. Each function resolves once the pop-up is open and REJECTS if it cannot be
 * opened (script blocked, offline, …) so the caller can fall back to the provider's full-page checkout.
 *
 * Neither pop-up decides whether a payment happened: its callbacks only tell us to ask our server, which
 * checks with the provider and settles idempotently.
 */

const PAYSTACK_SCRIPT = "https://js.paystack.co/v2/inline.js"
const SQUAD_SCRIPT = "https://checkout.squadco.com/widget/squad.min.js"

interface PaystackPopup {
  resumeTransaction: (
    accessCode: string,
    callbacks?: {
      onSuccess?: (transaction: { reference: string }) => void
      onCancel?: () => void
      onError?: (error: { message?: string }) => void
      onLoad?: () => void
    },
  ) => void
}

interface SquadInstance {
  setup: () => void
  open: () => void
}

declare global {
  interface Window {
    PaystackPop?: new () => PaystackPopup
    squad?: new (config: Record<string, unknown>) => SquadInstance
  }
}

export interface PaystackHandlers {
  onSuccess: (reference: string) => void
  onCancel: () => void
  onError: (message: string) => void
}

/** Opens Paystack's pop-up for a transaction our server already created (identified by its access code). */
export async function openPaystackPopup(accessCode: string, handlers: PaystackHandlers): Promise<void> {
  await loadScript(PAYSTACK_SCRIPT)
  if (!window.PaystackPop) throw new Error("Paystack pop-up is not available")
  new window.PaystackPop().resumeTransaction(accessCode, {
    onSuccess: (transaction) => handlers.onSuccess(transaction.reference),
    onCancel: handlers.onCancel,
    onError: (error) => handlers.onError(error?.message || "Payment could not be started"),
  })
}

export interface SquadHandlers {
  /** The pop-up reported a completed payment (the server still confirms it). */
  onSuccess: () => void
  /** The pop-up was closed, for any reason. */
  onClose: () => void
}

/** Opens Squad's pop-up for a payment our server already recorded. Amount and reference come from the server. */
export async function openSquadModal(session: SquadCheckoutSession, handlers: SquadHandlers): Promise<void> {
  await loadScript(SQUAD_SCRIPT)
  if (!window.squad) throw new Error("Squad pop-up is not available")
  const modal = new window.squad({
    key: session.publicKey,
    email: session.email,
    amount: session.amountKobo,
    currency_code: session.currency,
    transaction_ref: session.reference,
    customer_name: session.customerName,
    pass_charge: session.passCharge,
    metadata: { purpose: "subscription" },
    onSuccess: handlers.onSuccess,
    onClose: handlers.onClose,
  })
  modal.setup()
  modal.open()
}
