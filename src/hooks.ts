import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { parseParams, randomSeed, toSearch, type Params } from './lib/params'
import { readScreen, type ScreenInfo } from './lib/screen'

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    [query],
  )
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')

// All settings live in the query string, so the address bar is always a share link.
export function useUrlParams() {
  const [params, setParams] = useState<Params>(() => parseParams(window.location.search, randomSeed()))

  useEffect(() => {
    const next = toSearch(params)
    if (window.location.search !== next) window.history.replaceState(null, '', next)
  }, [params])

  const update = useCallback((patch: Partial<Params>) => setParams((p) => ({ ...p, ...patch })), [])
  return [params, update] as const
}

export function useScreen(): ScreenInfo {
  const [info, setInfo] = useState<ScreenInfo>(readScreen)
  useEffect(() => {
    const onChange = () => setInfo(readScreen())
    window.addEventListener('resize', onChange)
    window.addEventListener('orientationchange', onChange)
    return () => {
      window.removeEventListener('resize', onChange)
      window.removeEventListener('orientationchange', onChange)
    }
  }, [])
  return info
}
