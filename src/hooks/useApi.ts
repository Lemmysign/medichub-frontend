import { useCallback, useEffect, useRef, useState, type DependencyList } from "react"
import { errorMessage } from "@/lib/api"

export function useApi<T>(fetcher: () => Promise<T>, deps: DependencyList = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Once we have data, refetches (reload after a mutation, filter/page change) keep the
  // current data on screen instead of flashing the full-page spinner — which otherwise
  // unmounts the list and resets the scroll position to the top.
  const hasData = useRef(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(() => {
    if (!hasData.current) setLoading(true)
    return fetcher()
      .then((d) => {
        setData(d)
        hasData.current = true
        setError(null)
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false))
  }, deps)

  useEffect(() => {
    run()
  }, [run])

  return { data, loading, error, reload: run }
}
