import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { IconBrandLogo, IconPdf } from './brand-icons'
import { PrintDeck } from './PrintDeck'
import { SLIDE_LIST } from './slideList'

export default function App() {
  const [i, setI] = useState(0)
  const n = SLIDE_LIST.length

  const next = useCallback(() => setI((x) => Math.min(x + 1, n - 1)), [n])
  const prev = useCallback(() => setI((x) => Math.max(x - 1, 0)), [])

  const exportPdf = useCallback(() => {
    window.print()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault()
        next()
      }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        prev()
      }
      if (e.key === 'Home') {
        e.preventDefault()
        setI(0)
      }
      if (e.key === 'End') {
        e.preventDefault()
        setI(n - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, n])

  const Slide = SLIDE_LIST[i]

  const sideNavClass =
    'absolute top-0 z-20 h-full w-[min(12vw,7.5rem)] min-w-[44px] max-w-[120px] cursor-pointer border-0 bg-transparent p-0 md:min-w-[52px]'

  return (
    <div className="presentation-root relative h-full w-full overflow-hidden bg-[#05080f] text-slate-200">
      <div className="no-print relative z-10 flex h-full min-h-0 flex-col">
        <Aurora />
        <header className="relative z-30 flex shrink-0 items-center justify-between gap-3 px-5 py-3 md:px-10">
          <span className="mp-motion mp-fade-up mp-icon-hud flex min-w-0 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-mp-accent/85 md:text-xs">
            <IconBrandLogo className="h-7 w-7 shrink-0 md:h-8 md:w-8" />
            <span className="truncate">MyPlaythrough</span>
          </span>
          <div className="mp-motion mp-fade-up mp-fade-up-delay-1 flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={exportPdf}
              title="Print or save as PDF. Enable background graphics in Chrome/Edge for dark tones."
              className="relative z-40 inline-flex items-center gap-2 rounded-full border border-mp-accent/40 bg-mp-panel/80 px-3 py-1.5 text-[11px] font-semibold text-mp-accent shadow-sm transition hover:border-mp-accent hover:bg-mp-accent/10 md:px-4 md:text-xs"
            >
              <IconPdf className="h-4 w-4" />
              PDF
            </button>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] text-slate-400 tabular-nums md:text-xs">
              {i + 1} / {n}
            </span>
          </div>
        </header>

        <div className="relative z-0 min-h-0 flex flex-1 flex-col">
          <main className="relative z-10 min-h-0 flex-1 overflow-hidden px-5 md:px-12">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={i}
                role="group"
                aria-label={`Slide ${i + 1} of ${n}`}
                className="mx-auto flex h-full min-h-0 max-w-6xl flex-col"
                initial={{ opacity: 0, y: 36, filter: 'blur(14px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -28, filter: 'blur(10px)' }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <Slide />
              </motion.div>
            </AnimatePresence>
          </main>
          <button
            type="button"
            aria-label="Previous slide"
            className={`${sideNavClass} left-0 cursor-w-resize`}
            onClick={prev}
          />
          <button
            type="button"
            aria-label="Next slide"
            className={`${sideNavClass} right-0 cursor-e-resize`}
            onClick={next}
          />
        </div>

        <footer className="relative z-30 shrink-0 px-5 pb-4 pt-2 md:px-10">
          <div className="mb-1 flex gap-1.5">
            {SLIDE_LIST.map((_, j) => (
              <button
                key={j}
                type="button"
                aria-label={`Go to slide ${j + 1}`}
                aria-current={j === i ? 'step' : undefined}
                onClick={() => setI(j)}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  j === i
                    ? 'bg-mp-accent mp-motion mp-dot-active shadow-[0_0_14px_rgba(45,212,191,0.45)]'
                    : 'bg-white/10 hover:bg-white/25'
                }`}
              />
            ))}
          </div>
        </footer>
      </div>

      <PrintDeck />
    </div>
  )
}

function Aurora() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 opacity-[0.92]"
        style={{
          background:
            'radial-gradient(ellipse 85% 55% at 15% -5%, rgba(45,212,191,0.16), transparent 52%), radial-gradient(ellipse 55% 40% at 92% 15%, rgba(34,211,238,0.09), transparent 42%), linear-gradient(168deg, #060a11 0%, #0b1120 42%, #0a1624 100%)',
        }}
      />
      <motion.div
        className="absolute -left-24 top-[18%] h-[22rem] w-[22rem] rounded-full bg-mp-accent/18 blur-[100px] md:h-96 md:w-96"
        animate={{ scale: [1, 1.12, 1], opacity: [0.45, 0.7, 0.45] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-20 bottom-[5%] h-[18rem] w-[18rem] rounded-full bg-cyan-400/12 blur-[88px]"
        animate={{ scale: [1.08, 1, 1.08], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className="mp-pickup mp-pickup-pixel mp-pickup-a" />
      <span className="mp-pickup mp-pickup-pixel mp-pickup-b" />
      <span className="mp-pickup mp-pickup-gem mp-pickup-c" />
      <span className="mp-pickup mp-pickup-dpad mp-pickup-d" />
    </div>
  )
}
