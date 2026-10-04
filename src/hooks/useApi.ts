import { useCallback, useEffect, useRef, useState, type DependencyList } from "react"
import { errorMessage, httpStatus } from "@/lib/api"

/**
 * Loads data and re-loads it when `deps` change.
 *  - `loading`    true only for the very first load (show a full-page spinner).
 *  - `refreshing` true while a later load is in flight (page change, filter, reload). The previous data stays on
 *                 screen so the page does not jump, but callers should dim it / show a loading hint (see LoadingOverlay).
 * Only the most recent request may update the state, so a slow earlier response can never overwrite a newer one.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: DependencyList = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorStatus, setErrorStatus] = useState<number | null>(null)
  const hasData = useRef(false)
  const latest = useRef(0)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(() => {
    const mine = ++latest.current
    if (!hasData.current) setLoading(true)
    else setRefreshing(true)
    return fetcher()
      .then((d) => {
        if (mine !== latest.current) return // a newer request has started; drop this stale answer
        setData(d)
        hasData.current = true
        setError(null)
        setErrorStatus(null)
      })
      .catch((e) => {
        if (mine !== latest.current) return
        setError(errorMessage(e))
        setErrorStatus(httpStatus(e))
      })
      .finally(() => {
        if (mine !== latest.current) return
        setLoading(false)
        setRefreshing(false)
      })
  }, deps)

  useEffect(() => {
    run()
  }, [run])

  return { data, loading, refreshing, error, errorStatus, reload: run }
}
