import { Component, lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { readClock, type ClockReading } from '../lib/browser'
import type { Params } from '../lib/params'
import { sceneToSvg } from '../lib/render'
import { buildScene, logicalSize } from '../lib/scene'

const DeviceModel = lazy(() => import('./DeviceModel'))

class ModelBoundary extends Component<{onError: () => void; children: ReactNode}, {failed: boolean}> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onError() }
  render() { return this.state.failed ? null : this.props.children }
}

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
    if (reduced) setLeaving(null)
    else if (last.current.key !== swapKey) setLeaving(last.current)
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

function useFit(aspect: number, edge: number, stand: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const { width, height } = el.getBoundingClientRect()
      // Fit the whole front frame, but preserve the output ratio inside its bezel.
      const h = Math.max(0, Math.min((height - 16) / (1 + 2 * edge * aspect + (stand ? aspect * .105 : 0)), (width - 16) / (aspect * (1 + 2 * edge)), 680))
      const bezel = h * aspect * edge
      setBox({ w: h * aspect + bezel * 2, h: h + bezel * 2 })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [aspect, edge, stand])
  return [ref, box] as const
}

const dateText = () =>
  new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

interface Props {
  params: Params
  aspect: number
  reduced: boolean
  onReading: (r: ClockReading) => void
  view: '3d'|'composition'
  onView: (view: '3d'|'composition') => void
}

// Fade the current frame out before changing its device or projection. The latest
// request wins; rapid reversals cancel the pending swap instead of queuing motion.
function usePreviewSwap(input: Pick<Props, 'params'|'aspect'|'view'>, reduced: boolean) {
  const key = `${input.params.v}|${input.aspect}|${input.view}`
  const [shownKey, setShownKey] = useState(key)
  const [leaving, setLeaving] = useState(false)
  const shown = useRef(input), latest = useRef({ input, key })
  latest.current = { input, key }
  if (key === shownKey) shown.current = input
  useLayoutEffect(() => {
    if (key === shownKey) { setLeaving(false); return }
    if (reduced) { setShownKey(key); setLeaving(false); return }
    setLeaving(true)
    const timer = window.setTimeout(() => { setShownKey(latest.current.key); setLeaving(false) }, 140)
    return () => window.clearTimeout(timer)
  }, [key, shownKey, reduced])
  return { ...shown.current, leaving }
}

export function Preview({ params: requested, aspect: requestedAspect, reduced, onReading, view: requestedView, onView }: Props) {
  const { params, aspect, view, leaving } = usePreviewSwap({ params: requested, aspect: requestedAspect, view: requestedView }, reduced)
  const hp = params.v === 'hp'
  const [failed,setFailed] = useState(false)
  const onViewRef=useRef(onView);onViewRef.current=onView
  const failModel=useCallback(()=>{setFailed(true);onViewRef.current('composition')},[])
  const edge = hp ? .024 : .018
  const [ref, box] = useFit(aspect, edge, !hp)
  const bezel = box.w / (1 + 2 * edge) * edge
  const radius = hp ? box.w * .145 : box.w * .014
  const standHeight = hp ? 0 : (box.w - bezel * 2) * .105
  const svg = useMemo(() => sceneToSvg(buildScene(params, logicalSize(aspect))), [params, aspect])
  const swapKey = `${params.m}|${params.p}|${params.c}|${params.s}|${params.v}|${params.g}`
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

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-2">
      <div className="preview-mode" aria-label="Tampilan preview">
        <button type="button" aria-pressed={requestedView==='3d'} onClick={()=>{setFailed(false);onView('3d')}}>Perangkat 3D</button>
        <button type="button" aria-pressed={requestedView==='composition'} onClick={()=>onView('composition')}>Komposisi</button>
      </div>
      {failed && <p className="text-center text-[12px] text-ink-soft" role="status">3D belum tersedia di browser ini. Preview dan unduhan tetap bisa digunakan.</p>}
      <div ref={ref} className="preview-surface relative flex min-h-0 w-full flex-1 items-center justify-center" data-leaving={leaving} data-preview-device={params.v} data-preview-view={view}>
      {view==='3d' && <ModelBoundary onError={failModel}><Suspense fallback={<p className="text-[13px] text-ink-soft">Memuat tampilan 3D…</p>}><DeviceModel params={params} aspect={aspect} onError={failModel} reduced={reduced} /></Suspense></ModelBoundary>}
      {box.w > 0 && (
        <figure
          className={`composition-artboard relative m-0 ${hp ? 'front-iphone' : 'front-studio'}`}
          style={{ width: box.w, height: box.h, marginBottom: standHeight, borderRadius: radius, display:view==='composition'?'block':'none' }}
          aria-label={`Komposisi wallpaper ${params.m} pada ${hp ? 'iPhone' : 'Studio Display'} tampak depan`}
        >
          <div
            className="lock-screen absolute overflow-hidden"
            style={{ inset: bezel, borderRadius: Math.max(0, radius - bezel) }}
          >
            <Crossfade svg={svg} swapKey={swapKey} reduced={reduced} />
            {hp && <div className="front-island" aria-hidden="true" />}
            {hp ? (
              <div className={`absolute inset-0 flex flex-col items-center ${tone}`}>
                <p className="lock-date mt-[9.6cqh] capitalize">{date}</p>
                <p className="lock-clock mt-[0.6cqh]">9:41</p>
              </div>
            ) : (
              <div className={`absolute inset-0 flex flex-col items-center ${tone}`}>
                <p className="desk-date mt-[26cqh] capitalize">{date}</p>
                <p className="desk-clock mt-[0.8cqh]">9:41</p>
              </div>
            )}
          </div>
          {!hp && <span className="front-camera" style={{ top: bezel * .34, width: bezel * .28, height: bezel * .28 }} aria-hidden="true" />}
          {!hp && <div className="front-stand" style={{ height: standHeight }} aria-hidden="true"><div className="front-neck" /><div className="front-foot" /></div>}

        </figure>
      )}
      </div>
    </div>
  )
}
