import { useCallback, useDeferredValue, useEffect, useRef, useState } from 'react'
import { MotifNote, MotifPicker, PalettePicker, RangeField, SaveSection, SeedField, SectionHead } from './components/Controls'
import { Preview } from './components/Preview'
import { useMediaQuery, useReducedMotion, useScreen, useUrlParams } from './hooks'
import { downloadPng, type ClockReading } from './lib/browser'
import { MOTIF_INFO } from './lib/motifs'
import { PALETTE_LABELS } from './lib/palettes'
import { LIMITS, type Device } from './lib/params'
import { previewAspect } from './lib/screen'

const ratioText = (r: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(r)

function Readability({ reading }: { reading: ClockReading | null }) {
  if (!reading) return <p className="h-5" />
  const good = reading.ratio >= 4.5
  const ok = reading.ratio >= 3
  return (
    <p className="flex items-center justify-center gap-2 text-[12.5px] text-ink-soft" role="status">
      <span className={`h-1.5 w-1.5 rounded-full ${good ? 'bg-[#3f7a4f]' : ok ? 'bg-[#b8894f]' : 'bg-[#a8432f]'}`} aria-hidden="true" />
      <span>
        Jam {good ? 'enak dibaca' : ok ? 'masih kebaca' : 'kurang kebaca, coba palet lain'}
        <span className="tabular-nums">, kontras {ratioText(reading.ratio)}:1</span>
      </span>
    </p>
  )
}

function DeviceToggle({ value, onChange }: { value: Device; onChange: (d: Device) => void }) {
  const items: Array<[Device, string]> = [
    ['hp', 'HP'],
    ['desktop', 'Desktop'],
  ]
  return (
    <div role="radiogroup" aria-label="Preview di perangkat" className="relative grid grid-cols-2 rounded-full bg-paper-deep p-1 text-[13px]">
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-[#fffdf8] shadow-[0_1px_2px_rgb(43_33_24/0.18),0_2px_8px_rgb(43_33_24/0.08)] transition-transform duration-300 ease-(--ease-soft)"
        style={{ transform: value === 'desktop' ? 'translateX(100%)' : 'none' }}
      />
      {items.map(([d, label]) => (
        <button
          key={d}
          type="button"
          role="radio"
          aria-checked={value === d}
          onClick={() => onChange(d)}
          onKeyDown={(e) => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
              e.preventDefault()
              const next = d === 'hp' ? 'desktop' : 'hp'
              onChange(next)
              ;(e.currentTarget.parentElement?.querySelector(`[data-device="${next}"]`) as HTMLElement | null)?.focus()
            }
          }}
          tabIndex={value === d ? 0 : -1}
          data-device={d}
          className={`relative z-10 min-w-20 rounded-full px-4 py-1.5 font-medium transition-colors duration-300 ${value === d ? 'text-ink' : 'text-ink-soft hover:text-ink'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default function App() {
  const [params, update] = useUrlParams()
  const deferred = useDeferredValue(params)
  const screen = useScreen()
  const reduced = useReducedMotion()
  const desktop = useMediaQuery('(min-width: 1024px)')
  const [open, setOpen] = useState(false)
  const [reading, setReading] = useState<ClockReading | null>(null)
  const [busy, setBusy] = useState<Device | null>(null)
  const [error, setError] = useState('')
  const handleRef = useRef<HTMLButtonElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const aspect = previewAspect(screen, params.v)
  const collapsed = !desktop && !open

  const onReading = useCallback((r: ClockReading) => setReading(r), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        handleRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (collapsed && bodyRef.current) bodyRef.current.scrollTop = 0
  }, [collapsed])

  const download = async (d: Device) => {
    setBusy(d)
    setError('')
    try {
      await downloadPng(params, d, screen)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mengunduh')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(400px,440px)]">
      <main className="grain relative flex h-dvh flex-col pb-[calc(var(--peek)+env(safe-area-inset-bottom))] [--peek:170px] lg:sticky lg:top-0 lg:pb-0">
        <header className="flex items-baseline justify-between px-5 pt-4 lg:px-10 lg:pt-8">
          <div className="flex items-baseline gap-3">
            <h1 className="font-serif text-[26px] leading-none tracking-[-0.01em] lg:text-[34px]">Kawung</h1>
            <p className="hidden text-[13px] text-ink-soft sm:block">Wallpaper batik geometris, digambar dari kode</p>
          </div>
          <p className="label-caps hidden tabular-nums text-ink-soft lg:block">
            No. {String(params.s).padStart(5, '0')}
          </p>
        </header>

        <div className="flex min-h-0 flex-1 flex-col items-center gap-3 px-5 pb-3 pt-4 lg:gap-5 lg:px-10 lg:pb-8 lg:pt-6">
          <div className="min-h-0 w-full flex-1">
            <Preview params={deferred} aspect={aspect} reduced={reduced} onReading={onReading} />
          </div>
          <div className="flex flex-col items-center gap-2.5">
            <DeviceToggle value={params.v} onChange={(v) => update({ v })} />
            <Readability reading={reading} />
          </div>
        </div>
      </main>

      {!desktop && open && (
        <button
          type="button"
          aria-label="Tutup pengaturan"
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-10 bg-ink/15 backdrop-blur-[1px]"
        />
      )}

      <aside
        aria-label="Pengaturan wallpaper"
        className="sheet fixed inset-x-0 bottom-0 z-20 flex h-[86dvh] flex-col rounded-t-[22px] bg-paper shadow-[0_-1px_0_var(--color-hair),0_-18px_50px_-20px_rgb(43_33_24/0.35)] lg:static lg:z-auto lg:h-dvh lg:rounded-none lg:border-l lg:border-hair lg:shadow-none"
        style={desktop ? undefined : { transform: open ? 'translateY(0)' : 'translateY(calc(100% - 170px - env(safe-area-inset-bottom)))' }}
      >
        {!desktop && (
          <button
            ref={handleRef}
            type="button"
            aria-expanded={open}
            aria-controls="panel-body"
            onClick={() => setOpen((o) => !o)}
            className="flex w-full shrink-0 flex-col items-center px-5 pb-2 pt-2.5 text-left"
          >
            <span className="h-[5px] w-10 rounded-full bg-ink/20" aria-hidden="true" />
            <span className="mt-2.5 flex w-full items-center justify-between">
              <span className="text-[14px] font-semibold text-ink">
                {open ? 'Pengaturan' : 'Atur wallpaper'}
              </span>
              <span className="flex items-center gap-2 text-[12.5px] text-ink-soft">
                <span className="tabular-nums">
                  {MOTIF_INFO[params.m].name}, {PALETTE_LABELS[params.p]}, No. {params.s}
                </span>
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
                  <path d="M2.5 7.5 6 4l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </span>
          </button>
        )}

        <div ref={bodyRef} id="panel-body" className={`min-h-0 flex-1 overscroll-contain ${collapsed ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          <section aria-labelledby="sec-motif" className="px-5 pb-6 pt-1 lg:px-8 lg:pt-9">
            <SectionHead n="01" id="sec-motif" className="max-lg:sr-only">
              Motif
            </SectionHead>
            <MotifPicker params={params} update={update} />
            <div inert={collapsed}>
              <MotifNote m={params.m} />
            </div>
          </section>

          <div inert={collapsed}>
            <section aria-labelledby="sec-warna" className="px-5 pb-6 lg:px-8">
              <SectionHead n="02" id="sec-warna">
                Warna
              </SectionHead>
              <PalettePicker params={params} update={update} />
            </section>

            <section aria-labelledby="sec-susun" className="px-5 pb-6 lg:px-8">
              <SectionHead n="03" id="sec-susun">
                Susunan
              </SectionHead>
              <RangeField label="Kepadatan" value={params.d} min={LIMITS.d.min} max={LIMITS.d.max} onChange={(d) => update({ d })} />
              <RangeField label="Ketebalan garis" value={params.w} min={LIMITS.w.min} max={LIMITS.w.max} onChange={(w) => update({ w })} />
              <RangeField
                label="Rotasi"
                value={params.r}
                min={LIMITS.r.min}
                max={LIMITS.r.max}
                format={(v) => `${v}°`}
                onChange={(r) => update({ r })}
              />
              <SeedField params={params} update={update} />
            </section>

            <section aria-labelledby="sec-simpan" className="px-5 pb-8 lg:px-8">
              <SectionHead n="04" id="sec-simpan">
                Simpan
              </SectionHead>
              <SaveSection params={params} screen={screen} onDownload={download} busy={busy} />
              {error && (
                <p className="mt-3 text-[13px] text-[#a8432f]" role="alert">
                  {error}
                </p>
              )}
            </section>

            <footer className="border-t border-hair px-5 py-6 text-[12px] leading-relaxed text-ink-soft lg:px-8">
              <p>Semua digambar di browser kamu. Tanpa server, tanpa akun, tanpa pelacak.</p>
              <p className="mt-1">
                Kode sumber:{' '}
                <a href="https://github.com/SevenZ27/kawung" className="text-nila underline decoration-nila/30 underline-offset-[3px] hover:decoration-nila">
                  github.com/SevenZ27/kawung
                </a>
              </p>
            </footer>
          </div>
        </div>
      </aside>
    </div>
  )
}
