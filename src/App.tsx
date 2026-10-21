import { useCallback, useDeferredValue, useEffect, useRef, useState } from 'react'
import { MotifNote, MotifPicker, PalettePicker, RangeField, SaveSection, SeedField, SectionHead } from './components/Controls'
import { Preview } from './components/Preview'
import { useMediaQuery, useReducedMotion, useScreen, useUrlParams } from './hooks'
import { downloadPng, type ClockReading } from './lib/browser'
import { MOTIF_INFO } from './lib/motifs'
import { PALETTE_LABELS } from './lib/palettes'
import { LIMITS, type Device } from './lib/params'
import { DEVICE_SIZE, matchesDeviceSize, exportSize, previewAspect } from './lib/screen'

const ratioText = (r: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(r)

function Readability({ reading }: { reading: ClockReading | null }) {
  if (!reading) return <p className="h-5" />
  return (
    <div className="text-center text-[12px] leading-snug text-ink-soft" role="status">
      <span>
        Estimasi kontras area jam <span className="tabular-nums">{ratioText(reading.ratio)}:1</span>
      </span>
      <p className="mt-1 text-[11px]">P10 · {Math.round((reading.below3 ?? 0) * 100)}% area di bawah 3:1{(reading.below3 ?? 0) > .05 ? ' · Coba atur Dim' : ''}</p>
    </div>
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
          className={`relative z-10 min-h-11 min-w-20 rounded-full px-4 py-1.5 font-medium transition-colors duration-300 ${value === d ? 'text-ink' : 'text-ink-soft hover:text-ink'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default function App() {
  const [params, update] = useUrlParams()
  const [view, setView] = useState<'3d'|'composition'>(() => matchesDeviceSize(params) ? '3d' : 'composition')
  const changeView = (next: '3d'|'composition') => {
    if (next === '3d') update(DEVICE_SIZE[params.v])
    setView(next)
  }
  useEffect(() => {
    if (!matchesDeviceSize(params)) setView('composition')
  }, [params.v, params.x, params.y])
  const deferred = useDeferredValue(params)
  const screen = useScreen()
  const reduced = useReducedMotion()
  const desktop = useMediaQuery('(min-width: 1024px), (min-width: 700px) and (max-height: 500px)')
  const [open, setOpen] = useState(false)
  const [reading, setReading] = useState<ClockReading | null>(null)
  const [busy, setBusy] = useState<Device | null>(null)
  const [error, setError] = useState('')
  const handleRef = useRef<HTMLButtonElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const aspect = previewAspect(screen, deferred.v, deferred)
  const size = exportSize(screen, params.v, params)
  const collapsed = !desktop && !open
  const modal = !desktop && open

  const onReading = useCallback((r: ClockReading) => setReading(r), [])
  const closePanel = useCallback(() => {
    setOpen(false)
    window.requestAnimationFrame(() => handleRef.current?.focus())
  }, [])

  useEffect(() => {
    if (!modal) return
    handleRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePanel()
      }
      if (e.key === 'Tab') {
        const controls = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button, input, select, a[href], [tabindex]') ?? [])
          .filter((el) => !el.closest('[inert]') && !el.hasAttribute('disabled') && el.tabIndex >= 0 && el.getClientRects().length > 0)
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (e.shiftKey && (document.activeElement === first || !panelRef.current?.contains(document.activeElement))) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && (document.activeElement === last || !panelRef.current?.contains(document.activeElement))) {
          e.preventDefault()
          first?.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modal, closePanel])

  useEffect(() => { if (desktop) setOpen(false) }, [desktop])

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
    <div className="app-shell" data-wide={desktop}>
      <main inert={modal} className="grain preview-stage">
        <header className="stage-header flex items-baseline justify-between gap-3 px-5 pt-4 lg:px-10 lg:pt-8">
          <div className="flex items-baseline gap-3">
            <h1 className="font-serif text-[26px] leading-none tracking-[-0.01em] lg:text-[34px]">Kawung</h1>
            <p className="stage-tagline hidden text-[13px] text-ink-soft sm:block">Wallpaper batik geometris, digambar dari kode</p>
          </div>
          <p className="label-caps hidden tabular-nums text-ink-soft lg:block">
            No. {String(params.s).padStart(5, '0')}
          </p>
        </header>

        <div className="stage-content flex min-h-0 flex-1 flex-col items-center gap-3 px-5 pb-3 pt-4 lg:gap-5 lg:px-10 lg:pb-8 lg:pt-6">
          <div className="min-h-0 w-full flex-1">
            <Preview params={deferred} aspect={aspect} reduced={reduced} onReading={onReading} view={view} onView={changeView} />
          </div>
          <div className="stage-caption flex shrink-0 flex-col items-center gap-1.5">
            <DeviceToggle value={params.v} onChange={(v) => update({ v, ...(view === '3d' || Object.values(DEVICE_SIZE).some(s => s.x === params.x && s.y === params.y) ? DEVICE_SIZE[v] : {}) })} />
            <p className="text-[12px] tabular-nums text-ink-soft" data-testid="preview-size">{size.width.toLocaleString('id-ID')} × {size.height.toLocaleString('id-ID')} px</p>
            <Readability reading={reading} />
          </div>
        </div>
      </main>

      {!desktop && (
        <button
          type="button"
          aria-label="Tutup pengaturan"
          data-testid="settings-backdrop"
          tabIndex={-1}
          aria-hidden={!modal}
          inert={!modal}
          onClick={closePanel}
          className="settings-backdrop fixed inset-0 z-10 bg-ink/15 backdrop-blur-[1px]"
          data-open={modal}
        />
      )}

      <div
        ref={panelRef}
        role={modal ? 'dialog' : 'complementary'}
        aria-modal={modal || undefined}
        aria-label="Pengaturan wallpaper"
        className="settings-panel bg-paper"
        data-expanded={open}
      >
        {!desktop && (
          <div className="relative shrink-0">
            <button
              ref={handleRef}
              type="button"
              aria-expanded={open}
              aria-controls="panel-body"
              aria-describedby="selected-style"
              onClick={() => open ? closePanel() : setOpen(true)}
              className="sheet-handle flex min-h-14 w-full flex-col items-center px-5 pb-2 pt-2.5 text-left"
            >
              <span className="h-[5px] w-10 rounded-full bg-ink/20" aria-hidden="true" />
              <span className="mt-2.5 w-full text-[14px] font-semibold text-ink">
                {open ? 'Tutup pengaturan' : 'Atur wallpaper'}
              </span>
            </button>
            <span id="selected-style" className="pointer-events-none absolute right-5 bottom-2 flex max-w-[45%] items-center gap-2 text-[12.5px] text-ink-soft">
              <span className="truncate tabular-nums">{MOTIF_INFO[params.m].name} · {PALETTE_LABELS[params.p]}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className={`shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
                <path d="M2.5 7.5 6 4l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        )}

        <div ref={bodyRef} id="panel-body" className={`relative min-h-0 flex-1 overscroll-contain ${collapsed ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          <section aria-labelledby="sec-motif" className="px-5 pb-6 pt-1 lg:px-8 lg:pt-9">
            <SectionHead n="01" id="sec-motif" className="max-lg:sr-only">
              Motif
            </SectionHead>
            <MotifPicker params={params} update={update} />
            <div inert={collapsed} hidden={collapsed}>
              <MotifNote m={params.m} />
            </div>
          </section>

          <div inert={collapsed} hidden={collapsed}>
            <section aria-labelledby="sec-warna" className="px-5 pb-6 lg:px-8">
              <SectionHead n="02" id="sec-warna">
                Warna
              </SectionHead>
              <PalettePicker params={params} update={update} />
              <div className="mt-4">
                <RangeField label="Dim · gelap ke terang" value={params.dim ?? 0} min={-80} max={80} onChange={dim => update({ dim })} format={v => v === 0 ? 'Asli' : `${Math.abs(v)}% ${v < 0 ? 'gelap' : 'terang'}`} />
                <button type="button" className="min-h-11 text-[13px] font-medium text-nila underline underline-offset-4" onClick={() => update({ dim: 0 })}>Kembalikan warna asli</button>
              </div>
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
              <SaveSection params={params} screen={screen} update={update} onDownload={download} busy={busy} />
              {error && (
                <p className="mt-3 text-[13px] text-[#a8432f]" role="alert">
                  {error}
                </p>
              )}
            </section>

            <div className="border-t border-hair px-5 py-6 text-[12px] leading-relaxed text-ink-soft lg:px-8">
              <p>Motif dibuat di perangkatmu. Tanpa akun atau pelacak.</p>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
