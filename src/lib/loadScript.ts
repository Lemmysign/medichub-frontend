const loading = new Map<string, Promise<void>>()

/**
 * Loads a third-party script once and resolves when it is ready. Rejects on a network error, an
 * ad-blocker, or if it takes longer than {@code timeoutMs}, so callers can fall back instead of hanging.
 */
export function loadScript(src: string, timeoutMs = 10000): Promise<void> {
  const existing = loading.get(src)
  if (existing) return existing

  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = src
    script.async = true
    const timer = window.setTimeout(() => {
      script.remove()
      reject(new Error(`Timed out loading ${src}`))
    }, timeoutMs)
    script.onload = () => {
      window.clearTimeout(timer)
      resolve()
    }
    script.onerror = () => {
      window.clearTimeout(timer)
      script.remove()
      reject(new Error(`Could not load ${src}`))
    }
    document.head.appendChild(script)
  })

  // A failed load must not be cached, or one blocked attempt would break every retry.
  promise.catch(() => loading.delete(src))
  loading.set(src, promise)
  return promise
}
