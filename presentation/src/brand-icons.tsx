/** Iconos geométricos acordes a la marca (teal / formas limpias). */

/**
 * Isotipo de marca: mando (mismo motivo que cliente `IconController` + `public/favicon.svg`).
 * Contenedor con el mismo tratamiento que el logo del sidebar en `AppShell.jsx`.
 */
export function IconBrandLogo({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-slate-900/90 text-mp-accent shadow-[0_0_20px_-6px_rgba(45,212,191,0.5)] ring-1 ring-mp-accent/25 ${className}`}
      aria-hidden
    >
      <svg
        className="h-[52%] w-[52%] min-h-3 min-w-3 max-h-5 max-w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 11h2M7 10v2M16 11h.01M18 11h.01" />
        <rect x="2" y="7" width="20" height="10" rx="3" />
      </svg>
    </span>
  )
}

export function IconBrandPlay({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="2" y="2" width="36" height="36" rx="10" stroke="currentColor" strokeWidth="2" className="text-mp-accent/80" />
      <path d="M17 13v14l10-7-10-7z" fill="currentColor" className="text-mp-accent" />
    </svg>
  )
}

export function IconWindow({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="4" y="6" width="32" height="28" rx="4" stroke="currentColor" strokeWidth="2" className="text-mp-accent" />
      <path d="M4 12h32" stroke="currentColor" strokeWidth="2" className="text-mp-accent/60" />
      <circle cx="9" cy="9" r="1.5" fill="currentColor" className="text-mp-cta" />
      <circle cx="14" cy="9" r="1.5" fill="currentColor" className="text-mp-accent/50" />
    </svg>
  )
}

export function IconServer({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="6" y="8" width="28" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" className="text-mp-accent" />
      <rect x="6" y="18" width="28" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" className="text-mp-accent" />
      <rect x="6" y="28" width="28" height="6" rx="2" stroke="currentColor" strokeWidth="1.8" className="text-mp-accent/80" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" className="text-mp-cta" />
      <circle cx="12" cy="22" r="1.5" fill="currentColor" className="text-mp-cta" />
    </svg>
  )
}

export function IconDatabase({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <ellipse cx="20" cy="10" rx="14" ry="5" stroke="currentColor" strokeWidth="2" className="text-mp-accent" />
      <path d="M6 10v8c0 2.8 6.3 5 14 5s14-2.2 14-5v-8" stroke="currentColor" strokeWidth="2" className="text-mp-accent" />
      <path d="M6 18v8c0 2.8 6.3 5 14 5s14-2.2 14-5v-8" stroke="currentColor" strokeWidth="2" className="text-mp-accent" />
    </svg>
  )
}

export function IconArrowEdge({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M8 16h14M18 10l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-mp-accent/80" />
    </svg>
  )
}

export function IconPortrait({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="8" y="6" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" className="text-mp-accent" />
      <path d="M11 28h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-mp-accent/50" />
      <circle cx="22" cy="14" r="3" stroke="currentColor" strokeWidth="1.6" className="text-mp-cta" />
    </svg>
  )
}

export function IconUsers({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="12" cy="14" r="4" stroke="currentColor" strokeWidth="1.8" className="text-mp-accent" />
      <circle cx="24" cy="14" r="4" stroke="currentColor" strokeWidth="1.8" className="text-mp-cta" />
      <path d="M6 28c0-4 3-7 7-7M23 21c4 0 7 3 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-mp-accent/70" />
    </svg>
  )
}

export function IconLock({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="10" y="16" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2" className="text-mp-accent" />
      <path d="M13 16v-4a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-mp-accent" />
      <circle cx="18" cy="24" r="2" fill="currentColor" className="text-mp-cta" />
    </svg>
  )
}

export function IconCollection({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="6" y="8" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.8" className="text-mp-accent" />
      <rect x="18" y="8" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.8" className="text-mp-cta" />
      <rect x="12" y="20" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.8" className="text-mp-accent/80" />
    </svg>
  )
}

export function IconMail({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="5" y="10" width="26" height="16" rx="3" stroke="currentColor" strokeWidth="2" className="text-mp-accent" />
      <path d="M5 13l13 9 13-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-mp-cta" />
    </svg>
  )
}

export function IconLfg({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="18" cy="18" r="11" stroke="currentColor" strokeWidth="2" className="text-mp-accent/50" />
      <circle cx="18" cy="18" r="3" fill="currentColor" className="text-mp-accent" />
      <path d="M18 7v5M18 24v5M7 18h5M24 18h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-mp-cta" />
    </svg>
  )
}

export function IconShield({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M18 6l10 5v8c0 7-6 12-10 13-4-1-10-6-10-13v-8l10-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className="text-mp-accent" />
      <path d="M14 18l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-mp-cta" />
    </svg>
  )
}

export function IconPdf({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M4 2h8l4 4v12H4V2z" stroke="currentColor" strokeWidth="1.4" className="text-current" />
      <path d="M12 2v4h4M6 11h8M6 14h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-current opacity-80" />
    </svg>
  )
}
