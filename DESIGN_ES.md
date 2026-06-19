# DESIGN_ES.md — MyPlaythrough

Referencia del sistema de diseño de la aplicación web MyPlaythrough.  
Úsalo para mantener coherencia visual en todas las pantallas y componentes.

_(Versión en español de [DESIGN.md](DESIGN.md). El contenido técnico es equivalente.)_

---

## 1. Tema visual y atmósfera

MyPlaythrough usa una estética **HUD neón oscuro**: paneles mate, cuadrícula sutil y acentos cian/violeta. La interfaz no compite con la **carátula**.

- **Ambiente**: foco, modernidad, un toque arcade sin ruido visual.
- **Densidad**: media. Las tarjetas respiran; los formularios no van apretados.
- **Filosofía**: los acentos tienen significado (cian = acción, magenta = puntuaciones). Sin adornos vacíos.
- **Tipografía**: Space Grotesk en títulos, Plus Jakarta Sans en cuerpo, JetBrains Mono en stats.

---

## 2. Paleta de colores

Todos los colores están definidos como tokens Tailwind personalizados en `client/tailwind.config.js`.

| Token            | Hex       | Función                                           |
| ---------------- | --------- | ------------------------------------------------- |
| `brand-bg`       | `#0B0E14` | Fondo de página — negro mate profundo             |
| `brand-panel`    | `#11151E` | Superficie de tarjetas y paneles                  |
| `brand-input`    | `#0F141C` | Fondo de campos de formulario                     |
| `brand-surface`  | `#1A1F2B` | Estados hover, separadores sutiles                |
| `brand-surface2` | `#2A3142` | Bordes en elementos interactivos                  |
| `brand-accent`   | `#00F5FF` | Acento principal — cian neón                      |
| `brand-tealBtn`  | `#00F5FF` | Relleno del botón CTA (alias)                     |
| `brand-blue`     | `#7000FF` | Acento secundario — violeta eléctrico             |
| `brand-magenta`  | `#FF00E5` | Puntuaciones y alertas únicamente                 |
| `brand-line`     | `#1E2533` | Bordes finos                                      |

### Uso semántico

- **Cian** (`brand-accent` / `brand-tealBtn`) — acciones principales, estados activos, anillos de foco, enlaces.
- **Violeta** (`brand-blue`) — CTAs secundarios (`.figma-btn-violet`).
- **Magenta** — puntuaciones y acentos destructivos en tarjetas. Nunca cromo genérico de UI.
- **Rojo** — solo acciones destructivas (eliminar).
- **Blanco** — títulos y encabezados de tarjeta.
- **Slate-200** — texto de cuerpo por defecto.

### Fondo

Radiales cian / magenta / violeta en capas más una cuadrícula opcional de 48px (`body::before` en `index.css`). La carátula sigue siendo el protagonista visual.

---

## 3. Tipografía

| Rol      | Fuente               | Uso                                              |
| -------- | -------------------- | ------------------------------------------------ |
| Display  | **Space Grotesk**    | h1–h3 (regla global en `index.css`)              |
| Cuerpo   | **Plus Jakarta Sans**| Texto de interfaz por defecto                    |
| Mono     | **JetBrains Mono**   | Stats, badges, `.tabular-nums`, `.eyebrow`       |

| Elemento               | Clases                                                       | Uso                                   |
| ---------------------- | ------------------------------------------------------------ | ------------------------------------- |
| Título de página (H1)  | `text-3xl font-bold tracking-tight text-white sm:text-4xl`   | Cabecera del dashboard                |
| Título de sección (H2) | `text-xl font-bold tracking-tight text-white`                | Cabeceras de panel                    |
| Título de tarjeta (H3) | `text-base font-bold leading-snug tracking-tight text-white` | Título en tarjeta de juego            |
| Texto de cuerpo        | `text-sm text-slate-200`                                     | Descripciones, párrafos               |
| Etiqueta / pie         | `text-sm font-medium text-slate-400`                         | Labels de formulario, info secundaria |
| Badge / etiqueta       | `text-[0.65rem] font-bold uppercase tracking-wide`           | Estados, chip de plataforma           |

**Reglas:**

- Los títulos usan siempre `tracking-tight`. Nunca `tracking-normal` en H1–H3.
- `font-bold` en títulos y CTA. `font-medium` en labels. `font-semibold` en acciones secundarias.
- `line-clamp-2` en títulos de tarjeta para alinear grids.
- Valores numéricos (horas, puntuaciones) con `tabular-nums` para evitar saltos de layout.

---

## 4. Biblioteca de componentes

### Paneles / tarjetas — `.figma-panel`

```css
rounded-2xl border border-white/[0.08] bg-brand-panel shadow-figma ring-1 ring-white/[0.04]
```

El doble borde (`border` + `ring`) da un efecto de profundidad sutil en superficies oscuras. Usar siempre `rounded-2xl` en paneles, nunca `rounded-xl` ni `rounded-lg`.

### Inputs — `.figma-input`

```css
w-full rounded-lg border border-white/10 bg-brand-input px-4 py-3 text-white
placeholder:text-slate-500 transition
focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/25
```

Estado foco: borde teal + anillo al 25 % de opacidad. Nunca anillos de foco azules.

### Botón Primario — `.figma-btn-primary`

```css
inline-flex items-center justify-center gap-2 rounded-lg
bg-brand-tealBtn px-5 py-2.5 text-sm font-bold text-black
shadow-lg shadow-teal-900/25 transition
hover:brightness-95 active:scale-[0.98]
```

- Texto **negro** sobre teal — siempre. Nunca texto blanco sobre teal (contraste).
- `active:scale-[0.98]` da feedback táctil al pulsar.
- En botones de auth a ancho completo usar `py-3.5` para mayor área táctil.

### Botón contorno — `.figma-btn-outline`

```css
inline-flex w-full items-center justify-center rounded-lg
border border-white/10 bg-brand-input py-3 text-sm font-semibold text-white
transition hover:bg-white/[0.04]
```

Para acciones secundarias (cambiar modo auth, cancelar).

### Tarjeta de juego — `<GameCard />`

Estructura: contenedor `rounded-2xl` → zona de imagen `h-44` → contenido `p-5`.

Estados:

- **Por defecto**: `border-white/[0.06]`, `shadow-figma`
- **Hover**: `-translate-y-0.5`, `border-brand-accent/20`, `shadow-figma-lg` (con `group-hover`)

Imagen de fallback: gradiente `from-slate-800 to-slate-950` con inicial centrada en `text-white/[0.08]`.

Chip de plataforma: `bg-black/55 backdrop-blur-sm` — posición `top-3 left-3` sobre la carátula.

### Badge de estado

| Estado (BD)  | Texto mostrado | Clases                                           |
| ------------ | -------------- | ------------------------------------------------ |
| `Jugando`    | JUGANDO        | `bg-brand-tealBtn text-black border-transparent` |
| `Completado` | COMPLETADO     | `bg-brand-tealBtn text-black border-transparent` |
| `Pendiente`  | BACKLOG        | `bg-slate-700/80 text-slate-200 border-white/10` |

Nota: la UI muestra «BACKLOG» para `Pendiente` (`gameLabels.js`). Badges teal = estados activos/positivos. Badge gris = en cola/inactivo.

### Navegación lateral — `<AppShell />`

Ancho fijo `260px`.  
Fondo: `#0a0f1a` (algo más oscuro que `brand-bg`).  
Borde: `border-r border-white/[0.06]`.

Estados del enlace:

- **Activo**: `bg-white/[0.08] text-brand-accent shadow-inner shadow-black/20`
- **Inactivo**: `text-slate-400`
- **Hover (inactivo)**: `bg-white/[0.04] text-slate-200`

### Barra superior (búsqueda + avatar)

`sticky top-0 z-30 bg-brand-bg/90 backdrop-blur-lg border-b border-white/[0.06]`

El `backdrop-blur-lg` mantiene legible la barra al hacer scroll.

Avatar: `rounded-full border-2 border-brand-accent/50 bg-gradient-to-br from-slate-800 to-slate-900` — muestra la primera letra del nombre de usuario.

### Tablas (panel admin) — `.figma-table-wrap`

```css
overflow-x-auto rounded-2xl border border-white/[0.08] bg-brand-panel shadow-figma ring-1 ring-white/[0.04]
```

Cabeceras: `text-xs font-semibold uppercase tracking-wider text-slate-500`.  
Filas: `divide-y divide-white/[0.05]`.  
Hover de fila: `hover:bg-white/[0.03]`.

### Banners de error / alerta

```css
rounded-lg border border-red-500/35 bg-red-950/35 px-4 py-3 text-sm text-red-100
```

Incluir siempre `role="alert"` por accesibilidad.

---

## 5. Principios de maquetación

### Estructura de página

```
┌─────────────────────────────────────────────────────┐
│  Sidebar (260px fijo)   │  Barra superior (sticky)   │
│  ─────────────────────  │  ─────────────────────       │
│  Logo                   │  Búsqueda        [Avatar]    │
│  Enlaces nav            │                              │
│                         │  Área principal              │
│  [Cerrar sesión]        │  max-w-7xl px-6 py-8         │
└─────────────────────────────────────────────────────┘
```

### Área de contenido

`mx-auto w-full max-w-7xl flex-1 px-6 py-8 sm:px-8 sm:py-10`

### Grid de juegos

`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5`

Mismo `gap-5` (20px) entre tarjetas. No mezclar `gap-4` y `gap-6` en el mismo grid.

### Formularios

`flex flex-col gap-5` entre campos.  
`mb-1.5` entre etiqueta e input.  
Etiquetas siempre encima del campo, nunca solo placeholder como etiqueta.

---

## 6. Profundidad y elevación

| Nivel           | Token de sombra   | Uso                   |
| --------------- | ----------------- | --------------------- |
| Tarjeta base    | `shadow-figma`    | Elevación por defecto |
| Tarjeta elevada | `shadow-figma-lg` | Hover, modales        |

Definiciones:

```js
figma:    "0 4px 24px -4px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)"
figma-lg: "0 12px 40px -8px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05)"
```

La segunda capa (`0 0 0 1px rgba(255,255,255,...)`) crea el borde claro que hace «saltar» las tarjetas oscuras sobre el fondo.

---

## 7. Qué hacer y qué evitar

| ✅ Hacer                                   | ❌ Evitar                                                 |
| ------------------------------------------ | --------------------------------------------------------- |
| `rounded-2xl` en paneles y tarjetas        | Mezclar `rounded-lg` y `rounded-2xl` en el mismo contexto |
| `text-white` solo en títulos               | `text-white` en cuerpo (usar `text-slate-200`)            |
| Texto negro sobre botones teal             | Texto blanco sobre teal                                   |
| `tracking-tight` en todos los títulos      | Interletrado por defecto en H1–H3                         |
| `tabular-nums` en puntuaciones y horas     | Números de ancho variable en columnas alineadas           |
| `border-white/[0.06]` en bordes de tarjeta | Bordes blancos a opacidad plena                           |
| Un CTA principal por pantalla              | Dos botones teal lado a lado                              |
| `transition` en cada elemento interactivo  | Estados hover estáticos                                   |
| `active:scale-[0.98]` en botones           | Sin feedback al pulsar                                    |

---

## 8. Comportamiento responsive

| Breakpoint     | Comportamiento                                     |
| -------------- | -------------------------------------------------- |
| `sm` (640px+)  | Sidebar fijo; más padding en contenido (`sm:px-8`) |
| `md` (768px+)  | Grid de juegos a 2 columnas                        |
| `lg` (1024px+) | Grid a 3 columnas                                  |
| `xl` (1280px+) | Grid a 4 columnas                                  |

El sidebar **no** se colapsa en móvil en la implementación actual (limitación conocida, mejora futura).

Áreas táctiles: mínimo `p-2` en interactivos; botones al menos `py-2.5`.

---

## 9. Referencia rápida para nuevos componentes UI

Al añadir pantallas o componentes, conviene alinear colores y utilidades con lo ya definido.

**Color:**

- Fondo: `bg-brand-bg` (`#0B0E14`)
- Panel/tarjeta: `bg-brand-panel` (`#11151E`)
- Input: `bg-brand-input` (`#0F141C`)
- Acento principal: `brand-accent` / `brand-tealBtn` (`#00F5FF`)
- Acento secundario: `brand-blue` (`#7000FF`)
- Puntuaciones: `brand-magenta` (`#FF00E5`)
- Jerarquía de texto: `text-white` → `text-slate-200` → `text-slate-400` → `text-slate-500`

**Clases reutilizables (`index.css`):**

- `.figma-panel` — contenedor de tarjeta/panel
- `.figma-input` — campo de texto
- `.figma-btn-primary` — botón CTA cian (texto oscuro)
- `.figma-btn-violet` — CTA secundario
- `.figma-btn-outline` — botón secundario ghost
- `.figma-table-wrap` — contenedor de tabla admin
