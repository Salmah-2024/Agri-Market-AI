import { useCallback, useEffect, useState } from 'react'

import { api } from './api'

/** Load data from the API; returns { data, error, loading, reload }. Pass null path to skip. */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(!!path)

  const reload = useCallback(async () => {
    if (!path) return
    setLoading(true)
    setError(null)
    try {
      setData(await api<T>(path))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [path])

  useEffect(() => {
    reload()
  }, [reload])

  return { data, error, loading, reload, setData }
}
