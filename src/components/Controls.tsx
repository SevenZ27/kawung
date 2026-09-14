import { memo, useId, useMemo, useState, type ReactNode } from 'react'
import { MOTIF_INFO } from '../lib/motifs'
import { PALETTES, PALETTE_LABELS, customPalette } from '../lib/palettes'
import { LIMITS, MOTIF_IDS, PALETTE_IDS, randomSeed, toSearch, type Device, type MotifId, type Params } from '../lib/params'
import { sceneToSvg } from '../lib/render'
import { buildScene } from '../lib/scene'
import { exportSize, isPhoneScreen, type ScreenInfo } from '../lib/screen'

type Update = (patch: Partial<Params>) => void

export function SectionHead({ n, id, children, className = '' }: { n: string; id: string; children: ReactNode; className?: string }) {
  return (
    <div className={`mb-4 flex items-baseline gap-3 ${className}`}>
      <span className="label-caps tabular-nums text-sogan">{n}</span>
      <h2 id={id} className="label-caps text-ink">
        {children}
      </h2>
      <span className="h-px flex-1 translate-y-[-3px] bg-hair" aria-hidden="true" />
    </div>
  )
}

const Thumb = memo(function Thumb({ params }: { params: Params }) {
  const svg = useMemo(() => sceneToSvg(buildScene(params, { w: 1000, h: 1000 })), [params])
  return <span className="block h-full w-full [&>svg]:block [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
})

export function MotifPicker({ params, update }: { params: Params; update: Update }) {
  const thumbBase = useMemo(
    () => ({ ...params, d: Math.min(params.d, 4), r: 0 }),
    // thumbnails follow palette, seed and weight, not rotation
    [params.p, params.c, params.s, params.w, Math.min(params.d, 4)],
  )
  return (
    <fieldset>
      <legend className="sr-only">Pilih motif</legend>
      <div className="grid grid-cols-4 gap-2.5 lg:gap-3">
        {MOTIF_IDS.map((m) => {
          const active = params.m === m
          return (
            <label key={m} className="group relative block cursor-pointer select-none">
              <input
                type="radio"
                name="motif"
                value={m}
                checked={active}
                onChange={() => update({ m })}
                className="peer sr-only"
              />
              <span
                className={`block aspect-square overflow-hidden rounded-[10px] ring-offset-2 ring-offset-paper transition-[box-shadow,transform] duration-300 ease-(--ease-soft) peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-nila ${
                  active ? 'ring-[1.5px] ring-ink' : 'ring-1 ring-hair group-hover:-translate-y-0.5'
                }`}
              >
                <Thumb params={{ ...thumbBase, m }} />
              </span>
              <span
                className={`mt-1.5 block text-center font-serif text-[13px] leading-tight transition-colors lg:text-[15px] ${
                  active ? 'text-ink' : 'text-ink-soft'
                }`}
              >
                {MOTIF_INFO[m].name}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export function MotifNote({ m }: { m: MotifId }) {
  const info = MOTIF_INFO[m]
  return (
    <div className="mt-5 rounded-xl bg-paper-deep/70 px-4 py-3.5" aria-live="polite">
      <p className="font-serif text-[17px] italic leading-snug text-ink">{info.name}</p>
      {info.note ? (
        <>
          <p className="mt-1 text-[13.5px] leading-relaxed text-ink-soft">{info.note}</p>
          {info.source && (
            <a
              href={info.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-nila underline decoration-nila/30 underline-offset-[3px] hover:decoration-nila"
            >
              Sumber: {info.source.label}
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                <path d="M3 1h6v6M9 1 1.5 8.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
              </svg>
              <span className="sr-only">(buka di tab baru)</span>
            </a>
          )}
        </>
      ) : null}
      <p className="mt-2.5 border-t border-hair pt-2.5 text-[12px] leading-relaxed text-ink-soft">
        Yang digambar di sini interpretasi geometris dari struktur dasar motifnya, bukan salinan kain atau karya tertentu.
      </p>
    </div>
  )
}

export function PalettePicker({ params, update }: { params: Params; update: Update }) {
  const colorId = useId()
  return (
    <fieldset>
      <legend className="sr-only">Pilih palet warna</legend>
      <div className="grid grid-cols-4 gap-2">
        {PALETTE_IDS.map((p) => {
          const pal = p === 'bebas' ? customPalette(params.c) : PALETTES[p]
          const active = params.p === p
          return (
            <label key={p} className="relative block cursor-pointer select-none">
              <input type="radio" name="palette" value={p} checked={active} onChange={() => update({ p })} className="peer sr-only" />
              <span
                className={`flex flex-col items-center gap-2 rounded-xl px-1 py-2.5 transition-colors duration-300 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-nila ${
                  active ? 'bg-paper-deep' : 'hover:bg-paper-deep/60'
                }`}
              >
                <span
                  className={`relative block h-9 w-9 overflow-hidden rounded-full transition-shadow duration-300 ${
                    active ? 'shadow-[0_0_0_2px_var(--color-paper),0_0_0_3.5px_var(--color-ink)]' : 'shadow-[0_0_0_1px_var(--color-hair)]'
                  }`}
                  aria-hidden="true"
                >
                  <span className="absolute inset-0" style={{ background: pal.bg }} />
                  <span className="absolute inset-y-0 right-0 w-1/2" style={{ background: pal.deep }} />
                  <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: pal.line }} />
                </span>
                <span className={`text-[12.5px] ${active ? 'font-semibold text-ink' : 'text-ink-soft'}`}>{PALETTE_LABELS[p]}</span>
              </span>
            </label>
          )
        })}
      </div>
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-(--ease-soft) ${
          params.p === 'bebas' ? 'mt-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
        inert={params.p !== 'bebas'}
      >
        <div className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-hair px-3.5 py-2.5">
            <label htmlFor={colorId} className="text-[13.5px] text-ink">
              Warna dasar
            </label>
            <span className="flex items-center gap-2.5">
              <span className="font-mono text-[12.5px] uppercase tabular-nums text-ink-soft">#{params.c}</span>
              <input
                id={colorId}
                type="color"
                value={`#${params.c}`}
                onChange={(e) => update({ p: 'bebas', c: e.target.value.slice(1).toLowerCase() })}
                className="h-8 w-11 cursor-pointer rounded-md border border-hair bg-transparent p-0.5"
              />
            </span>
          </div>
        </div>
      </div>
    </fieldset>
  )
}

interface RangeProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  format?: (v: number) => string
  onChange: (v: number) => void
}

export function RangeField({ label, value, min, max, step = 1, format = String, onChange }: RangeProps) {
  const id = useId()
  const fill = ((value - min) / (max - min)) * 100
  return (
    <div className="py-1.5">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-[13.5px] text-ink">
          {label}
        </label>
        <output htmlFor={id} className="text-[13px] tabular-nums text-ink-soft">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className="range mt-1"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ ['--fill' as string]: `${fill}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}

export function SeedField({ params, update }: { params: Params; update: Update }) {
  const id = useId()
  const [spin, setSpin] = useState(0)
  return (
    <div className="flex items-end gap-3 pt-2">
      <div className="flex-1">
        <label htmlFor={id} className="text-[13.5px] text-ink">
          Seed
        </label>
        <p className="text-[12px] text-ink-soft">Angka yang sama, motif yang sama.</p>
      </div>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={LIMITS.s.min}
        max={LIMITS.s.max}
        value={params.s}
        onChange={(e) => {
          const n = Math.floor(Number(e.target.value))
          if (Number.isFinite(n)) update({ s: Math.min(LIMITS.s.max, Math.max(LIMITS.s.min, n)) })
        }}
        className="h-10 w-[6.5rem] rounded-lg border border-hair bg-white/50 px-3 text-right font-mono text-[14px] tabular-nums text-ink"
      />
      <button
        type="button"
        onClick={() => {
          update({ s: randomSeed() })
          setSpin((k) => k + 1)
        }}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink px-3.5 text-[13.5px] font-medium text-paper transition-[background-color,transform] duration-200 hover:bg-[#3a2d22] active:scale-[0.97]"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="transition-transform duration-500 ease-(--ease-soft)"
          style={{ transform: `rotate(${spin * 180}deg)` }}
        >
          <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13.5 6A5.6 5.6 0 0 0 3 4.6M2.5 10A5.6 5.6 0 0 0 13 11.4" />
            <path d="M3 1.8v2.8h2.8M13 14.2v-2.8h-2.8" />
          </g>
        </svg>
        Acak
      </button>
    </div>
  )
}

const px = (n: number) => new Intl.NumberFormat('id-ID').format(n)

export function SaveSection({ params, screen, onDownload, busy }: { params: Params; screen: ScreenInfo; onDownload: (d: Device) => void; busy: Device | null }) {
  const [copied, setCopied] = useState(false)
  const linkId = useId()
  const phone = isPhoneScreen(screen)
  const sizes = { hp: exportSize(screen, 'hp'), desktop: exportSize(screen, 'desktop') }
  const href = `${window.location.origin}${window.location.pathname}${toSearch(params)}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(href)
    } catch {
      const input = document.getElementById(linkId) as HTMLInputElement | null
      input?.select()
      document.execCommand?.('copy')
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2200)
  }

  const order: Device[] = params.v === 'hp' ? ['hp', 'desktop'] : ['desktop', 'hp']

  return (
    <div>
      <div className="grid gap-2.5">
        {order.map((d, k) => {
          const size = sizes[d]
          const primary = k === 0
          return (
            <button
              key={d}
              type="button"
              onClick={() => onDownload(d)}
              disabled={busy !== null}
              data-testid={`download-${d}`}
              className={`group flex items-center justify-between rounded-xl px-4 py-3 text-left transition-[background-color,box-shadow,transform] duration-200 active:scale-[0.99] disabled:cursor-progress ${
                primary ? 'bg-ink text-paper hover:bg-[#3a2d22]' : 'text-ink shadow-[inset_0_0_0_1px_var(--color-hair)] hover:bg-paper-deep'
              }`}
            >
              <span>
                <span className="block text-[14.5px] font-medium">
                  {busy === d ? 'Menyiapkan PNG...' : d === 'hp' ? 'Unduh PNG untuk HP' : 'Unduh PNG untuk desktop'}
                </span>
                <span className={`block text-[12px] tabular-nums ${primary ? 'text-paper/70' : 'text-ink-soft'}`}>
                  {px(size.width)} x {px(size.height)} px{size.capped ? ', diperkecil sesuai batas browser' : ''}
                </span>
              </span>
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="transition-transform duration-300 group-hover:translate-y-0.5">
                <path d="M8 2.5v8M4.5 7.5 8 11l3.5-3.5M3 13.5h10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-[12.5px] leading-relaxed text-ink-soft">
        Ukurannya dihitung dari layar yang lagi kamu pakai (lebar layar x devicePixelRatio).
        {!phone && ' Biar pas di HP, salin link di bawah lalu buka dan unduh dari HP kamu.'}
      </p>

      <div className="mt-5">
        <label htmlFor={linkId} className="text-[13.5px] text-ink">
          Link berbagi
        </label>
        <div className="mt-1.5 flex gap-2">
          <input
            id={linkId}
            readOnly
            value={href}
            onFocus={(e) => e.currentTarget.select()}
            className="h-10 min-w-0 flex-1 rounded-lg border border-hair bg-white/50 px-3 font-mono text-[12px] text-ink-soft"
          />
          <button
            type="button"
            onClick={copy}
            className="h-10 shrink-0 rounded-lg px-3.5 text-[13.5px] font-medium text-ink shadow-[inset_0_0_0_1px_var(--color-hair)] transition-colors hover:bg-paper-deep"
          >
            {copied ? 'Tersalin' : 'Salin'}
          </button>
        </div>
        <p className="sr-only" role="status">
          {copied ? 'Link tersalin' : ''}
        </p>
      </div>
    </div>
  )
}
