import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { readClock, type ClockReading } from '../lib/browser'
import type { Params } from '../lib/params'
import { sceneToSvg } from '../lib/render'
import { buildScene, logicalSize } from '../lib/scene'

interface Layer {
  key: string
  svg: string
}

// Keeps the old wallpaper on top for one fade when motif, palette, seed or device
// change. Slider moves update in place so dragging stays direct.
function Crossfade({ svg, swapKey, reduced }: { svg: string; swapKey: string; reduced: boolean }) {
  const last = useRef<Layer>({ key: swapKey, svg })
  const [leaving, setLeaving] = useState<Layer | null>(null)

  useLayoutEffect(() => {
    if (last.current.key !== swapKey && !reduced) setLeaving(last.current)
    last.current = { key: swapKey, svg }
  }, [swapKey, svg, reduced])

  return (
    <>
      <div className="wallpaper-layer" data-testid="wallpaper" dangerouslySetInnerHTML={{ __html: svg }} />
      {leaving && (
        <div
          key={leaving.key}
          className="wallpaper-layer wallpaper-leaving"
          aria-hidden="true"
          onAnimationEnd={() => setLeaving(null)}
          dangerouslySetInnerHTML={{ __html: leaving.svg }}
        />
      )}
    </>
  )
}

function useFit(aspect: number, reserve: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const { width, height } = el.getBoundingClientRect()
      const h = Math.max(0, Math.min(height - reserve, width / aspect))
      setBox({ w: Math.floor(h * aspect), h: Math.floor(h) })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [aspect, reserve])
  return [ref, box] as const
}

const dateText = () =>
  new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

interface Props {
  params: Params
  aspect: number
  reduced: boolean
  onReading: (r: ClockReading) => void
}

export function Preview({ params, aspect, reduced, onReading }: Props) {
  const hp = params.v === 'hp'
  // the desktop mockup needs a little room below for its stand
  const [ref, box] = useFit(aspect, hp ? 0 : 28)
  const svg = useMemo(() => sceneToSvg(buildScene(params, logicalSize(aspect))), [params, aspect])
  const swapKey = `${params.m}|${params.p}|${params.c}|${params.s}|${params.v}`
  const [reading, setReading] = useState<ClockReading>({ tone: 'light', ratio: 0 })
  const date = useMemo(dateText, [])

  useEffect(() => {
    const id = window.setTimeout(() => {
      const r = readClock(params, aspect)
      setReading(r)
      onReading(r)
    }, 90)
    return () => window.clearTimeout(id)
  }, [params, aspect, onReading])

  const tone = reading.tone === 'light' ? 'lock-light' : 'lock-dark'
  const bezel = hp ? Math.max(6, box.w * 0.035) : Math.max(5, box.w * 0.012)

  return (
    <div ref={ref} className="relative flex h-full w-full items-center justify-center">
      {box.w > 0 && (
        <figure
          className="relative m-0"
          style={{ width: box.w, height: box.h }}
          aria-label={`Preview wallpaper ${params.m} di ${hp ? 'lock screen HP' : 'layar desktop'}`}
        >
          <div
            className="absolute inset-0 bg-[#1d1813]"
            style={{
              borderRadius: hp ? box.w * 0.15 : box.w * 0.02,
              boxShadow:
                'inset 0 0 0 1px rgb(255 255 255 / 0.08), 0 1px 1px rgb(43 33 24 / 0.12), 0 18px 40px -12px rgb(43 33 24 / 0.38), 0 50px 90px -40px rgb(43 33 24 / 0.45)',
            }}
          />
          <div
            className="lock-screen absolute overflow-hidden"
            style={{ inset: bezel, borderRadius: hp ? box.w * 0.15 - bezel : box.w * 0.02 - bezel * 0.6 }}
          >
            <Crossfade svg={svg} swapKey={swapKey} reduced={reduced} />
            {hp ? (
              <div className={`absolute inset-0 flex flex-col items-center ${tone}`}>
                <div className="mt-[3.2cqh] h-[3.4cqw] w-[3.4cqw] rounded-full bg-[#0d0a08]/85" aria-hidden="true" />
                <p className="lock-date mt-[5cqh] capitalize">{date}</p>
                <p className="lock-clock mt-[0.6cqh]">9:41</p>
                <div className="absolute bottom-[1.6cqh] h-[1.3cqw] w-[34cqw] rounded-full bg-current opacity-80" aria-hidden="true" />
              </div>
            ) : (
              <div className={`absolute inset-0 flex flex-col items-center ${tone}`}>
                <p className="desk-date mt-[26cqh] capitalize">{date}</p>
                <p className="desk-clock mt-[0.8cqh]">9:41</p>
              </div>
            )}
          </div>
          {!hp && (
            <div aria-hidden="true" className="absolute left-1/2 top-full -translate-x-1/2">
              <div className="mx-auto h-[18px] w-[64px] bg-gradient-to-b from-[#cfc6b6] to-[#bdb3a2]" />
              <div className="h-[6px] w-[150px] rounded-t-[3px] rounded-b-[6px] bg-[#b3a996]" />
            </div>
          )}
        </figure>
      )}
    </div>
  )
}
