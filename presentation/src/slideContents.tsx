import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import {
  IconArrowEdge,
  IconDatabase,
  IconPortrait,
  IconServer,
  IconUsers,
  IconWindow,
} from './brand-icons'
import { APP_DEMO_URL, REPO_PUBLIC_URL } from './config'
import { PRODUCT_SWATCHES, SLIDE_FEATURES_DATA } from './slidesShared'

const spring = { type: 'spring' as const, stiffness: 140, damping: 22 }

const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: spring },
}

const stagger = (delay = 0) => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: delay },
  },
})

export function SlideCover() {
  return (
    <div className="flex h-full flex-col items-center justify-center py-4 text-center">
      <motion.div className="flex max-w-3xl flex-col items-center" initial="hidden" animate="visible" variants={stagger(0.05)}>
        <motion.span
          variants={fadeUp}
          className="mb-5 inline-flex rounded-full border border-mp-accent/35 bg-mp-panel/80 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.25em] text-mp-accent shadow-[0_0_32px_rgba(45,212,191,0.12)] backdrop-blur-md"
        >
          Integrated project defense
        </motion.span>
        <motion.div
          variants={fadeUp}
          className="mp-accent-bar mb-7 h-1.5 w-32 rounded-full shadow-[0_0_28px_rgba(45,212,191,0.45)]"
        />
        <motion.h1
          variants={fadeUp}
          className="mb-4 font-[family-name:var(--font-display)] text-5xl font-extrabold tracking-tight text-white md:text-7xl"
          style={{ fontFamily: '"Syne", system-ui, sans-serif' }}
        >
          My<span className="bg-gradient-to-r from-mp-accent to-mp-cta bg-clip-text text-transparent">Play</span>through
        </motion.h1>
        <motion.p variants={fadeUp} className="mb-2 max-w-xl text-lg text-slate-300 md:text-2xl">
          Personal video game library and lightweight community.
        </motion.p>
        <motion.p variants={fadeUp} className="mb-10 text-base text-slate-500 md:text-lg">
          Integrated project · PERN stack
        </motion.p>
        <motion.div
          variants={fadeUp}
          className="w-full max-w-xl rounded-3xl border border-white/10 bg-mp-panel/90 p-8 text-left shadow-2xl ring-1 ring-mp-accent/25 backdrop-blur-xl"
        >
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-mp-accent/90">Project details</p>
          <p className="text-white">
            <strong>Author:</strong> <span className="text-mp-gold">Ikrame Ibn Hayoun</span>
          </p>
          <p className="mt-3 text-slate-300">
            <strong>Programme:</strong> Higher Vocational Training in Web Application Development ·{' '}
            <span className="text-slate-500">2nd year</span>
          </p>
          <p className="mt-3 text-slate-300">
            <strong>Supervisor:</strong> María Jesús Rodríguez Sánchez
          </p>
          <p className="mt-3 text-sm text-slate-500">
            <strong>Academic year:</strong> 2025/2026
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

export function SlideProduct() {
  return (
    <div className="flex h-full flex-col justify-center py-2 md:py-6">
      <div className="grid gap-10 md:grid-cols-2 md:items-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger(0)}
          className="space-y-6"
        >
          <motion.h2 variants={fadeUp} className="font-[family-name:var(--font-display)] text-4xl font-bold text-white md:text-5xl" style={{ fontFamily: '"Syne", sans-serif' }}>
            What is MyPlaythrough
          </motion.h2>
          <motion.p variants={fadeUp} className="text-xl font-medium leading-snug text-slate-200 md:text-2xl">
            Your game library plus a light social layer.
          </motion.p>
          <motion.div variants={fadeUp} className="grid gap-4">
            <div className="grid grid-cols-[auto_1fr] items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <div className="mp-icon-hud flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-mp-accent/25 bg-mp-panel/60">
                <IconPortrait className="h-9 w-9" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-white">Collection</p>
                <p className="mt-0.5 text-sm text-slate-400">Status, scores, hours, cover art.</p>
              </div>
            </div>
            <div className="grid grid-cols-[auto_1fr] items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <div className="mp-icon-hud flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-mp-accent/25 bg-mp-panel/60">
                <IconUsers className="h-9 w-9" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-white">Community</p>
                <p className="mt-0.5 text-sm text-slate-400">Profiles, follows, recommendations, LFG.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger(0.12)}
          className="flex flex-col gap-4"
        >
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -4, transition: spring }}
            className="rounded-3xl border border-white/10 bg-mp-panel/90 p-6 shadow-xl ring-1 ring-white/5 backdrop-blur-sm"
          >
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-mp-accent">Palette</p>
            <div className="flex flex-wrap gap-3">
              {PRODUCT_SWATCHES.map((c, i) => (
                <motion.span
                  key={c}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 + i * 0.06, ...spring }}
                  whileHover={{ scale: 1.12, rotate: 4 }}
                  className="h-11 w-11 cursor-default rounded-xl ring-2 ring-white/20 shadow-lg"
                  style={{ backgroundColor: c }}
                  title="Color"
                />
              ))}
            </div>
          </motion.div>
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-mp-accent/25 bg-slate-950/80 px-5 py-4 text-center text-sm font-medium text-slate-300 backdrop-blur-sm md:text-left"
          >
            Cover art via <span className="text-mp-accent">Steam</span> and <span className="text-mp-accent">RAWG</span>
            <span className="text-slate-500"> · browser-friendly server proxy</span>
          </motion.div>
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-white/10 bg-mp-panel/60 px-5 py-3 text-center text-xs text-slate-500 md:text-left"
          >
            Academic goal: full PERN stack — UI, API, database, and security.
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

function ArchCard({
  icon,
  title,
  stack,
  hint,
}: {
  icon: ReactNode
  title: string
  stack: string
  hint: string
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={spring}
      className="flex h-full flex-col rounded-3xl border border-white/10 bg-gradient-to-br from-mp-panel to-slate-950 p-6 text-center shadow-lg ring-1 ring-mp-accent/15"
    >
      <div className="mp-icon-hud mb-3 flex justify-center">{icon}</div>
      <p className="text-lg font-bold text-white">{title}</p>
      <p className="mt-3 text-sm font-medium text-slate-300">{stack}</p>
      <p className="mt-4 flex-1 text-center text-sm leading-snug text-slate-400 md:text-left">{hint}</p>
    </motion.div>
  )
}

function FlowArrow() {
  return (
    <motion.div variants={fadeUp} className="hidden items-center justify-center md:flex">
      <motion.div animate={{ x: [0, 6, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}>
        <span className="mp-icon-hud inline-flex items-center justify-center" aria-hidden>
          <IconArrowEdge className="h-10 w-10" />
        </span>
      </motion.div>
    </motion.div>
  )
}

export function SlideArch() {
  return (
    <div className="flex h-full flex-col justify-center py-2">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="mb-6 text-center font-[family-name:var(--font-display)] text-4xl font-bold text-white md:text-5xl"
        style={{ fontFamily: '"Syne", sans-serif' }}
      >
        Architecture · PERN
      </motion.h2>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger(0)}
        className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]"
      >
        <ArchCard
          icon={<IconWindow className="h-12 w-12" />}
          title="Client (React)"
          stack="Vite · Tailwind"
          hint="Browser UI without unnecessary full reloads."
        />
        <FlowArrow />
        <ArchCard
          icon={<IconServer className="h-12 w-12" />}
          title="API (Node)"
          stack="Express · REST"
          hint="Authentication, business rules, safe responses."
        />
        <FlowArrow />
        <ArchCard
          icon={<IconDatabase className="h-12 w-12" />}
          title="Database"
          stack="PostgreSQL"
          hint="Relations, integrity, persistent data."
        />
      </motion.div>
    </div>
  )
}

function SchemaBlock({
  badge,
  title,
  tech,
  micro,
  children,
}: {
  badge: string
  title: string
  tech: string
  micro: string
  children?: ReactNode
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="flex h-full flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-mp-panel/95 to-slate-950/90 p-4 shadow-lg ring-1 ring-mp-accent/10 md:p-5"
    >
      <p className="text-2xl font-bold leading-none text-mp-accent md:text-3xl">{badge}</p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-lg font-bold text-white md:text-xl" style={{ fontFamily: '"Syne", sans-serif' }}>
        {title}
      </p>
      <p className="mt-1 font-mono text-[10px] text-slate-500 md:text-xs">{tech}</p>
      <p className="mt-3 text-center text-[11px] leading-tight text-slate-400 md:text-left md:text-xs">{micro}</p>
      {children != null ? (
        <div className="mt-2 flex flex-1 flex-col gap-2 text-sm text-slate-300">{children}</div>
      ) : null}
    </motion.div>
  )
}

function SchemaRel({ label, sub }: { label: string; sub?: string }) {
  return (
    <>
      <div className="flex flex-col items-center justify-center py-1 text-mp-accent/90 md:hidden">
        <span className="text-xl" aria-hidden>
          ↓
        </span>
        <span className="mt-0.5 max-w-[14rem] text-center text-[9px] font-semibold uppercase leading-tight tracking-wide text-slate-500">
          {label}
        </span>
        {sub ? <span className="mt-0.5 text-center text-[9px] text-slate-600">{sub}</span> : null}
      </div>
      <div className="hidden flex-col items-center justify-center px-1 py-2 text-mp-accent/90 md:flex md:px-2">
        <span className="select-none text-2xl font-light md:text-3xl" aria-hidden>
          →
        </span>
        <span className="max-w-[5rem] text-center text-[9px] font-semibold uppercase leading-tight tracking-wide text-slate-500 md:max-w-none md:text-[10px]">
          {label}
        </span>
        {sub ? <span className="mt-0.5 max-w-[4.5rem] text-center text-[9px] leading-tight text-slate-600 md:max-w-[6rem]">{sub}</span> : null}
      </div>
    </>
  )
}

export function SlideSchema() {
  return (
    <div className="flex h-full flex-col justify-center gap-3 py-1 md:gap-4 md:py-2">
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="text-center font-[family-name:var(--font-display)] text-3xl font-bold text-white md:text-4xl"
        style={{ fontFamily: '"Syne", sans-serif' }}
      >
        Data model
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.04 }}
        className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-1 gap-y-2 rounded-2xl border border-mp-accent/20 bg-slate-950/60 px-3 py-3 text-[11px] text-slate-300 md:gap-x-2 md:px-4 md:text-sm"
      >
        <span className="font-semibold text-mp-accent">1</span>
        <span>account</span>
        <span className="text-mp-accent/70">→</span>
        <span className="font-semibold text-white">many</span>
        <span>library rows</span>
        <span className="text-mp-accent/70">→</span>
        <span>each points to</span>
        <span className="font-semibold text-mp-accent">1 catalogue entry</span>
        <span>(shared)</span>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger(0.05)}
        className="mx-auto w-full max-w-5xl space-y-4"
      >
        <div className="rounded-3xl border border-mp-accent/25 bg-mp-panel/30 p-4 ring-1 ring-white/5 backdrop-blur-sm md:p-5">
          <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-mp-accent/90">Core tables</p>
          <div className="mx-auto mb-3 hidden h-1 max-w-md rounded-full bg-gradient-to-r from-mp-accent/80 via-mp-accent/30 to-mp-accent/80 md:block" aria-hidden />
          <div className="grid grid-cols-1 items-stretch gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:gap-1">
            <SchemaBlock badge="①" title="Your account" tech="usuarios" micro="Who you are: login, profile, role." />
            <SchemaRel label="has" sub="many rows" />
            <SchemaBlock badge="②" title="Your library" tech="juegos" micro="Each row: one added game + your status and notes." />
            <SchemaRel label="share" sub="game record" />
            <SchemaBlock badge="③" title="Catalogue" tech="catalogo_juegos" micro="Canonical game: title and cover (Steam/RAWG)." />
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 md:p-5">
          <p className="mb-1 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Community</p>
          <p className="mb-3 text-center text-[11px] text-slate-500">Social features linked to users and game entries</p>
          <motion.div variants={fadeUp} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                { k: 'Comments · votes', s: 'On the public entry' },
                { k: 'Follows', s: 'User ↔ user' },
                { k: 'Recommendations', s: 'To the inbox' },
                { k: 'LFG', s: 'From your library' },
              ] as const
            ).map((row) => (
              <div
                key={row.k}
                className="rounded-xl border border-white/10 bg-mp-panel/70 px-3 py-2.5 text-center shadow-sm sm:text-left"
              >
                <p className="text-sm font-semibold text-white">{row.k}</p>
                <p className="mt-1 text-[10px] leading-snug text-slate-500 md:text-[11px]">{row.s}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

export function SlideFeatures() {
  return (
    <div className="flex h-full flex-col justify-center py-2">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="mb-8 text-center font-[family-name:var(--font-display)] text-3xl font-bold text-white md:text-4xl"
        style={{ fontFamily: '"Syne", sans-serif' }}
      >
        Main features
      </motion.h2>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } } }}
        className="mp-features-grid grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {SLIDE_FEATURES_DATA.map((f) => {
          const I = f.Icon
          return (
            <motion.div
              key={f.title}
              variants={fadeUp}
              whileHover={{ y: -5, transition: spring }}
              className="rounded-2xl border border-white/10 bg-mp-panel/80 p-5 ring-1 ring-white/5 backdrop-blur-sm"
            >
              <div className="mp-icon-hud mb-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-mp-accent/20 bg-mp-panel/80">
                <I className="h-9 w-9" />
              </div>
              <p className="font-semibold text-white">{f.title}</p>
              <p className="mt-1 text-sm text-slate-400">{f.text}</p>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}

export function SlideDemo() {
  const homeHref = `${APP_DEMO_URL}/`
  const communityHref = `${APP_DEMO_URL}/community`
  const docsHref = 'https://ikrame-ih.github.io/my-playthrough/'

  const steps = [
    <>
      <strong className="text-white">Collection</strong> — Add a game, pick cover art, confirmation when returning to the list.
    </>,
    <>
      <strong className="text-white">Community & social</strong> — Profiles, follows, recommendations with modal confirmation; bell and
      recommendation inbox; LFG posts when they fit the demo flow.
    </>,
  ]

  return (
    <div className="flex h-full flex-col justify-center gap-6 py-2">
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="text-center font-[family-name:var(--font-display)] text-3xl font-bold text-white md:text-4xl"
        style={{ fontFamily: '"Syne", sans-serif' }}
      >
        Walkthrough
      </motion.h2>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger(0.04)}
        className="mx-auto flex w-full max-w-lg flex-col gap-3 sm:flex-row sm:justify-center"
      >
        <motion.a
          variants={fadeUp}
          href={docsHref}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-mp-accent to-mp-cta px-6 py-4 text-center text-base font-bold text-slate-950 shadow-[0_12px_40px_rgba(45,212,191,0.35)] transition-shadow hover:shadow-[0_16px_48px_rgba(45,212,191,0.45)]"
        >
          Project docs & screenshots
        </motion.a>
        <motion.a
          variants={fadeUp}
          href={communityHref}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex flex-1 items-center justify-center rounded-2xl border-2 border-mp-accent/50 bg-mp-panel/80 px-6 py-4 text-center text-base font-semibold text-mp-accent backdrop-blur-sm"
        >
          Local community view
        </motion.a>
      </motion.div>

      <p className="mx-auto max-w-lg text-center font-mono text-[10px] leading-relaxed text-slate-600 md:text-[11px]">
        <span className="block break-all">{docsHref}</span>
        <span className="block text-slate-500">Run locally: {homeHref}</span>
      </p>

      <motion.ol
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }}
        className="mx-auto max-w-xl list-decimal space-y-3 rounded-2xl border border-white/10 bg-mp-panel/40 py-6 pl-11 pr-6 text-sm text-slate-300 marker:font-semibold marker:text-mp-accent md:text-base"
      >
        {steps.map((content, i) => (
          <motion.li key={i} variants={fadeUp} className="leading-snug">
            {content}
          </motion.li>
        ))}
      </motion.ol>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="text-center text-sm text-slate-500"
      >
        Project defense · <strong className="text-slate-400">5 May 2026 · 18:15</strong> · Demo account in README.
      </motion.p>
    </div>
  )
}

export function SlideClosing() {
  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-3xl py-6 text-center">
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-100"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(45,212,191,0.15), transparent 55%), linear-gradient(180deg, transparent, rgba(6,10,17,0.9))',
        }}
      />
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger(0.06)}
        className="relative z-10 flex flex-col items-center"
      >
        <motion.span
          variants={fadeUp}
          className="mb-5 inline-flex rounded-full border border-mp-accent/35 bg-mp-panel/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-mp-accent"
        >
          Closing
        </motion.span>
        <motion.h2
          variants={fadeUp}
          className="mb-4 font-[family-name:var(--font-display)] text-5xl font-extrabold text-white md:text-6xl"
          style={{ fontFamily: '"Syne", sans-serif' }}
        >
          Questions?
        </motion.h2>
        <motion.p variants={fadeUp} className="text-lg text-slate-400">
          Thank you for your attention
        </motion.p>
        <motion.div
          variants={fadeUp}
          className="mt-10 w-full max-w-lg rounded-2xl border border-white/10 bg-mp-panel/90 px-6 py-5 text-left text-sm text-slate-400 shadow-2xl ring-1 ring-mp-accent/20 backdrop-blur-md"
        >
          <p className="font-semibold text-mp-accent">Code & documentation</p>
          <motion.a
            href={REPO_PUBLIC_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ x: 3 }}
            className="mt-3 block break-all text-base font-medium text-white underline decoration-mp-accent/50 underline-offset-4 transition-colors hover:text-mp-accent hover:decoration-mp-accent"
          >
            {REPO_PUBLIC_URL}
          </motion.a>
          <p className="mt-4 text-xs font-normal text-slate-500">
            README · <span className="font-mono text-slate-500">docs/</span> ·{' '}
            <span className="font-mono text-slate-500">DESIGN.md</span> · SQL schema
          </p>
          <p className="mt-4 text-sm font-medium text-mp-gold">Ikrame Ibn Hayoun · 2025/2026</p>
        </motion.div>
      </motion.div>
    </div>
  )
}
