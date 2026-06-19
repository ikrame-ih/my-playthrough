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

/** Mismo fondo base que la presentación (sin blur animado para PDF). */
const slideBg =
  'radial-gradient(ellipse 85% 55% at 15% -5%, rgba(45,212,191,0.14), transparent 52%), radial-gradient(ellipse 55% 40% at 92% 15%, rgba(34,211,238,0.08), transparent 42%), linear-gradient(168deg, #060a11 0%, #0b1120 42%, #0a1624 100%)'

const fontSyne = { fontFamily: '"Syne", system-ui, sans-serif' } as const

function PrintPage({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`print-page text-white ${className}`} style={{ background: slideBg }}>
      {children}
    </section>
  )
}

/**
 * Réplica estática de las slides en pantalla (misma rejilla, tarjetas e iconos).
 * Sin Framer Motion para que “Guardar como PDF” siga generando archivos válidos.
 */
export function PrintDeck() {
  const homeHref = `${APP_DEMO_URL}/`
  const communityHref = `${APP_DEMO_URL}/community`

  return (
    <div className="print-root">
      {/* Portada — SlideCover */}
      <PrintPage className="flex flex-col items-center justify-center px-5 py-8 text-center md:px-10 md:py-10">
        <div className="flex max-w-3xl flex-col items-center">
          <span className="mb-5 inline-flex rounded-full border border-mp-accent/35 bg-mp-panel/90 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.25em] text-mp-accent shadow-[0_0_32px_rgba(45,212,191,0.12)]">
            Defensa proyecto integrado
          </span>
          <div className="mb-7 h-1.5 w-32 rounded-full bg-gradient-to-r from-mp-accent to-mp-cta shadow-[0_0_28px_rgba(45,212,191,0.45)]" />
          <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-white md:text-7xl" style={fontSyne}>
            My
            <span className="bg-gradient-to-r from-mp-accent to-mp-cta bg-clip-text text-transparent">Play</span>
            through
          </h1>
          <p className="mb-2 max-w-xl text-lg text-slate-300 md:text-2xl">
            Biblioteca personal de videojuegos y comunidad.
          </p>
          <p className="mb-10 text-base text-slate-500 md:text-lg">Proyecto integrado · Stack PERN</p>
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-mp-panel/90 p-8 text-left shadow-2xl ring-1 ring-mp-accent/25">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-mp-accent/90">Datos académicos</p>
            <p className="text-white">
              <strong>Alumno/a:</strong> <span className="text-mp-gold">Ikrame Ibn Hayoun</span>
            </p>
            <p className="mt-3 text-slate-300">
              <strong>Titulación:</strong> CFGS DAW · <span className="text-slate-500">2.º año</span>
            </p>
            <p className="mt-3 text-slate-300">
              <strong>Tutora:</strong> María Jesús Rodríguez Sánchez
            </p>
            <p className="mt-3 text-sm text-slate-500">
              <strong>Centro:</strong> CESUR Málaga Este · Curso 2025/2026
            </p>
          </div>
        </div>
      </PrintPage>

      {/* Qué es — SlideProduct */}
      <PrintPage className="px-5 py-8 md:px-10 md:py-10">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-white md:text-5xl" style={fontSyne}>
              Qué es MyPlaythrough
            </h2>
            <p className="text-xl font-medium leading-snug text-slate-200 md:text-2xl">
              Tu biblioteca de videojuegos + comunidad ligera.
            </p>
            <div className="grid gap-4">
              <div className="grid grid-cols-[auto_1fr] items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-mp-accent/25 bg-mp-panel/60">
                  <IconPortrait className="h-9 w-9" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white">Colección</p>
                  <p className="mt-0.5 text-sm text-slate-400">Estado, notas, horas, portadas.</p>
                </div>
              </div>
              <div className="grid grid-cols-[auto_1fr] items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-mp-accent/25 bg-mp-panel/60">
                  <IconUsers className="h-9 w-9" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white">Comunidad</p>
                  <p className="mt-0.5 text-sm text-slate-400">Perfiles, seguir, recomendar, LFG.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl border border-white/10 bg-mp-panel/90 p-6 shadow-xl ring-1 ring-white/5">
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-mp-accent">Paleta</p>
              <div className="flex flex-wrap gap-3">
                {PRODUCT_SWATCHES.map((c) => (
                  <span
                    key={c}
                    className="h-11 w-11 rounded-xl ring-2 ring-white/20 shadow-lg"
                    style={{ backgroundColor: c }}
                    title="Color"
                    aria-hidden
                  />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-mp-accent/25 bg-slate-950/80 px-5 py-4 text-center text-sm font-medium text-slate-300 md:text-left">
              Portadas vía <span className="text-mp-accent">Steam</span> y <span className="text-mp-accent">RAWG</span>
              <span className="text-slate-500"> · servidor compatible con navegador</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-mp-panel/60 px-5 py-3 text-center text-xs text-slate-500 md:text-left">
              Objetivo académico: PERN completo — interfaz, API, base de datos y seguridad.
            </div>
          </div>
        </div>
      </PrintPage>

      {/* Arquitectura — SlideArch */}
      <PrintPage className="flex flex-col justify-center px-5 py-8 md:px-10 md:py-10">
        <h2 className="mb-6 text-center text-4xl font-bold text-white md:text-5xl" style={fontSyne}>
          Arquitectura · PERN
        </h2>
        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <PrintArchCard
            icon={<IconWindow className="h-12 w-12" />}
            title="Cliente (React)"
            stack="Vite · Tailwind"
            hint="Interfaz en el navegador, sin recargar de más."
          />
          <div className="hidden items-center justify-center md:flex">
            <IconArrowEdge className="h-10 w-10 text-mp-accent/90" />
          </div>
          <PrintArchCard
            icon={<IconServer className="h-12 w-12" />}
            title="API (Node)"
            stack="Express · REST"
            hint="Autenticación, reglas y respuestas seguras."
          />
          <div className="hidden items-center justify-center md:flex">
            <IconArrowEdge className="h-10 w-10 text-mp-accent/90" />
          </div>
          <PrintArchCard
            icon={<IconDatabase className="h-12 w-12" />}
            title="Base de datos"
            stack="PostgreSQL"
            hint="Relaciones, integridad, datos persistentes."
          />
        </div>
      </PrintPage>

      {/* Modelo de datos — SlideSchema */}
      <PrintPage className="flex flex-col justify-center gap-3 px-5 py-6 md:gap-4 md:px-10 md:py-8">
        <h2 className="text-center text-3xl font-bold text-white md:text-4xl" style={fontSyne}>
          Modelo de datos
        </h2>
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-1 gap-y-2 rounded-2xl border border-mp-accent/20 bg-slate-950/60 px-3 py-3 text-[11px] text-slate-300 md:gap-x-2 md:px-4 md:text-sm">
          <span className="font-semibold text-mp-accent">1</span>
          <span>cuenta</span>
          <span className="text-mp-accent/70">→</span>
          <span className="font-semibold text-white">muchas</span>
          <span>filas en tu lista</span>
          <span className="text-mp-accent/70">→</span>
          <span>cada una apunta a</span>
          <span className="font-semibold text-mp-accent">1 ficha</span>
          <span>del catálogo (compartida)</span>
        </div>
        <div className="mx-auto w-full max-w-5xl space-y-4">
          <div className="rounded-3xl border border-mp-accent/25 bg-mp-panel/30 p-4 ring-1 ring-white/5 md:p-5">
            <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-mp-accent/90">
              Las tres tablas del núcleo
            </p>
            <div className="mx-auto mb-3 hidden h-1 max-w-md rounded-full bg-gradient-to-r from-mp-accent/80 via-mp-accent/30 to-mp-accent/80 md:block" />
            <div className="grid grid-cols-1 items-stretch gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:gap-1">
              <PrintSchemaBlock badge="①" title="Tu cuenta" tech="usuarios" micro="Quién eres: login, perfil, rol." />
              <PrintSchemaRel label="tiene" sub="muchas filas" />
              <PrintSchemaBlock
                badge="②"
                title="Tu biblioteca"
                tech="juegos"
                micro="Cada fila: un juego añadido + tu estado y notas."
              />
              <PrintSchemaRel label="comparten" sub="la ficha del juego" />
              <PrintSchemaBlock
                badge="③"
                title="Catálogo"
                tech="catalogo_juegos"
                micro="La ficha del juego: título y portada (Steam/RAWG)."
              />
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 md:p-5">
            <p className="mb-1 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Comunidad</p>
            <p className="mb-3 text-center text-[11px] text-slate-500">
              Cosas sociales enlazadas a usuarios y a fichas de juego
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  { k: 'Comentarios · votos', s: 'Sobre la ficha pública' },
                  { k: 'Seguimientos', s: 'Usuario ↔ usuario' },
                  { k: 'Recomendaciones', s: 'A la bandeja' },
                  { k: 'LFG', s: 'Desde un juego tuyo' },
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
            </div>
          </div>
        </div>
      </PrintPage>

      {/* Funciones — SlideFeatures */}
      <PrintPage className="flex flex-col justify-center px-5 py-8 md:px-10 md:py-10">
        <h2 className="mb-8 text-center text-3xl font-bold text-white md:text-4xl" style={fontSyne}>
          Funciones principales
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SLIDE_FEATURES_DATA.map((f) => {
            const I = f.Icon
            return (
              <div
                key={f.title}
                className="rounded-2xl border border-white/10 bg-mp-panel/80 p-5 ring-1 ring-white/5"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-mp-accent/20 bg-mp-panel/80">
                  <I className="h-9 w-9" />
                </div>
                <p className="font-semibold text-white">{f.title}</p>
                <p className="mt-1 text-sm text-slate-400">{f.text}</p>
              </div>
            )
          })}
        </div>
      </PrintPage>

      {/* Demo — SlideDemo */}
      <PrintPage className="flex flex-col justify-center gap-6 px-5 py-8 md:px-10 md:py-10">
        <h2 className="text-center text-3xl font-bold text-white md:text-4xl" style={fontSyne}>
          Demo en vivo
        </h2>
        <div className="mx-auto flex w-full max-w-lg flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={homeHref}
            className="inline-flex flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-mp-accent to-mp-cta px-6 py-4 text-center text-base font-bold text-slate-950 shadow-[0_12px_40px_rgba(45,212,191,0.35)]"
          >
            Inicio · tu colección
          </a>
          <a
            href={communityHref}
            className="inline-flex flex-1 items-center justify-center rounded-2xl border-2 border-mp-accent/50 bg-mp-panel/80 px-6 py-4 text-center text-base font-semibold text-mp-accent"
          >
            Comunidad
          </a>
        </div>
        <p className="mx-auto max-w-lg text-center font-mono text-[10px] leading-relaxed text-slate-600 md:text-[11px]">
          <span className="block break-all">{homeHref}</span>
          <span className="block break-all">{communityHref}</span>
        </p>
        <ol className="mx-auto max-w-xl list-decimal space-y-3 rounded-2xl border border-white/10 bg-mp-panel/40 py-6 pl-11 pr-6 text-sm text-slate-300 marker:font-semibold marker:text-mp-accent md:text-base">
          <li className="leading-snug">
            <strong className="text-white">Colección</strong> — Alta de juego, elegir portada y aviso al volver a la lista.
          </li>
          <li className="leading-snug">
            <strong className="text-white">Comunidad y social</strong> — Perfil, seguir, recomendar con confirmación en el
            modal; campana y bandeja de recomendaciones; publicar o mostrar LFG si encaja en el guion · turno de preguntas.
          </li>
        </ol>
        <p className="text-center text-sm text-slate-500">
          Defensa · <strong className="text-slate-400">5 mayo 2026 · 18:15</strong> · Cuenta demo en README («Rellenar cuenta
          demo»).
        </p>
      </PrintPage>

      {/* Cierre — SlideClosing */}
      <PrintPage className="relative flex flex-col items-center justify-center overflow-hidden px-5 py-10 text-center md:px-10 md:py-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-100"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(45,212,191,0.15), transparent 55%), linear-gradient(180deg, transparent, rgba(6,10,17,0.9))',
          }}
          aria-hidden
        />
        <div className="relative z-10 flex flex-col items-center">
          <span className="mb-5 inline-flex rounded-full border border-mp-accent/35 bg-mp-panel/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-mp-accent">
            Cierre
          </span>
          <h2 className="mb-4 text-5xl font-extrabold text-white md:text-6xl" style={fontSyne}>
            ¿Preguntas?
          </h2>
          <p className="text-lg text-slate-400">Gracias por su atención</p>
          <div className="mt-10 w-full max-w-lg rounded-2xl border border-white/10 bg-mp-panel/90 px-6 py-5 text-left text-sm text-slate-400 shadow-2xl ring-1 ring-mp-accent/20">
            <p className="font-semibold text-mp-accent">Código y documentación</p>
            <a
              href={REPO_PUBLIC_URL}
              className="mt-3 block break-all text-base font-medium text-white underline decoration-mp-accent/50 underline-offset-4"
            >
              {REPO_PUBLIC_URL}
            </a>
            <p className="mt-4 text-xs font-normal text-slate-500">
              README · carpeta <span className="font-mono text-slate-500">docs/</span> ·{' '}
              <span className="font-mono text-slate-500">DESIGN_ES.md</span> · esquema SQL
            </p>
          </div>
        </div>
      </PrintPage>
    </div>
  )
}

function PrintArchCard({
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
    <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-gradient-to-br from-mp-panel to-slate-950 p-6 text-center shadow-lg ring-1 ring-mp-accent/15">
      <div className="mb-3 flex justify-center text-mp-accent">{icon}</div>
      <p className="text-lg font-bold text-white">{title}</p>
      <p className="mt-3 text-sm font-medium text-slate-300">{stack}</p>
      <p className="mt-4 flex-1 text-center text-sm leading-snug text-slate-400 md:text-left">{hint}</p>
    </div>
  )
}

function PrintSchemaBlock({
  badge,
  title,
  tech,
  micro,
}: {
  badge: string
  title: string
  tech: string
  micro: string
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-mp-panel/95 to-slate-950/90 p-4 shadow-lg ring-1 ring-mp-accent/10 md:p-5">
      <p className="text-2xl font-bold leading-none text-mp-accent md:text-3xl">{badge}</p>
      <p className="mt-2 text-lg font-bold text-white md:text-xl" style={fontSyne}>
        {title}
      </p>
      <p className="mt-1 font-mono text-[10px] text-slate-500 md:text-xs">{tech}</p>
      <p className="mt-3 text-center text-[11px] leading-tight text-slate-400 md:text-left md:text-xs">{micro}</p>
    </div>
  )
}

function PrintSchemaRel({ label, sub }: { label: string; sub?: string }) {
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
        {sub ? (
          <span className="mt-0.5 max-w-[4.5rem] text-center text-[9px] leading-tight text-slate-600 md:max-w-[6rem]">
            {sub}
          </span>
        ) : null}
      </div>
    </>
  )
}
