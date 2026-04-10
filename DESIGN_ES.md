# DESIGN_ES.md — MyPlaythrough

Referencia del sistema de diseño de la aplicación web MyPlaythrough.  
Úsalo para mantener coherencia visual en todas las pantallas y componentes.

*(Versión en español de [DESIGN.md](DESIGN.md). El contenido técnico es equivalente.)*

---

## 1. Tema visual y atmósfera

MyPlaythrough usa una estética de **biblioteca digital oscura**. La interfaz es deliberadamente sobria: la **carátula del juego** es el protagonista; el resto queda en segundo plano.

- **Ambiente**: calma, foco, modernidad. Sin gradientes que compitan por atención.
- **Densidad**: media. Las tarjetas respiran; los formularios no van apretados.
- **Filosofía**: «menos es más». Un color de acento. Dos niveles de superficie. Nada decorativo sin función.
- **Inspiración**: la experiencia de biblioteca en modo oscuro de Spotify y la precisión técnica de Linear, pero más cálida y orientada al gaming.

---

## 2. Paleta de colores

Todos los colores están definidos como tokens Tailwind personalizados en `tailwind.config.js`.

| Token | Hex | Función |
|---|---|---|
| `brand-bg` | `#0B1120` | Fondo de página — azul marino mate profundo |
| `brand-panel` | `#161D2F` | Superficie de tarjetas y paneles |
| `brand-input` | `#0F172A` | Fondo de campos y botón secundario |
| `brand-surface` | `#1E293B` | Estados hover, separadores sutiles |
| `brand-surface2` | `#334155` | Bordes en elementos interactivos |
| `brand-accent` | `#2DD4BF` | Acento principal — teal vibrante |
| `brand-tealBtn` | `#36D7B7` | Relleno del botón CTA (variante ligeramente más clara) |
| `brand-blue` | `#007BFF` | Acento secundario — azul eléctrico |
| `white` | `#FFFFFF` | Texto principal |
| `slate-200` | `#E2E8F0` | Texto de cuerpo por defecto |
| `slate-400` | `#94A3B8` | Etiquetas / texto secundario |
| `slate-500` | `#64748B` | Placeholder y texto desactivado |
| `amber-400` | `#FBBF24` | Estrella de puntuación — dorado cálido |
| `red-400` | `#F87171` | Hover en acciones destructivas |

### Uso semántico

- **Teal** (`brand-accent` / `brand-tealBtn`) — acciones principales, estados activos, badges de nota, momentos de marca.
- **Azul** (`brand-blue`) — enlaces, elementos interactivos secundarios.
- **Ámbar** — solo para mostrar puntuación. Nunca para acciones de interfaz.
- **Rojo** — solo hover en acciones destructivas. Nunca informativo.
- **Blanco** — solo títulos y encabezados de tarjeta.
- **Slate-200** — peso por defecto del texto de cuerpo.

### Resplandor radial de fondo

La página aplica un gradiente radial teal suave arriba al centro para dar profundidad sin distraer:

```css
background-image: radial-gradient(
  ellipse 90% 60% at 50% -15%,
  rgba(45, 212, 191, 0.09),
  transparent 55%
);
```

---

## 3. Tipografía

**Pila de fuentes:** `Inter`, `DM Sans`, `system-ui`, `Segoe UI`, `sans-serif`

Se prefiere Inter. El fallback `system-ui` mantiene la interfaz limpia aunque no carguen las fuentes web.

| Elemento | Clases | Uso |
|---|---|---|
| Título de página (H1) | `text-3xl font-bold tracking-tight text-white sm:text-4xl` | Cabecera del dashboard |
| Título de sección (H2) | `text-xl font-bold tracking-tight text-white` | Cabeceras de panel |
| Título de tarjeta (H3) | `text-base font-bold leading-snug tracking-tight text-white` | Título en tarjeta de juego |
| Texto de cuerpo | `text-sm text-slate-200` | Descripciones, párrafos |
| Etiqueta / pie | `text-sm font-medium text-slate-400` | Labels de formulario, info secundaria |
| Badge / etiqueta | `text-[0.65rem] font-bold uppercase tracking-wide` | Estados, chip de plataforma |
| Ítem de navegación | `text-sm font-medium` | Enlaces del sidebar |

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

| Estado (BD) | Texto mostrado | Clases |
|---|---|---|
| `Jugando` | JUGANDO | `bg-brand-tealBtn text-black border-transparent` |
| `Completado` | COMPLETADO | `bg-brand-tealBtn text-black border-transparent` |
| `Pendiente` | BACKLOG | `bg-slate-700/80 text-slate-200 border-white/10` |

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

| Nivel | Token de sombra | Uso |
|---|---|---|
| Tarjeta base | `shadow-figma` | Elevación por defecto |
| Tarjeta elevada | `shadow-figma-lg` | Hover, modales |

Definiciones:

```js
figma:    "0 4px 24px -4px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)"
figma-lg: "0 12px 40px -8px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05)"
```

La segunda capa (`0 0 0 1px rgba(255,255,255,...)`) crea el borde claro que hace «saltar» las tarjetas oscuras sobre el fondo.

---

## 7. Qué hacer y qué evitar

| ✅ Hacer | ❌ Evitar |
|---|---|
| `rounded-2xl` en paneles y tarjetas | Mezclar `rounded-lg` y `rounded-2xl` en el mismo contexto |
| `text-white` solo en títulos | `text-white` en cuerpo (usar `text-slate-200`) |
| Texto negro sobre botones teal | Texto blanco sobre teal |
| `tracking-tight` en todos los títulos | Interletrado por defecto en H1–H3 |
| `tabular-nums` en puntuaciones y horas | Números de ancho variable en columnas alineadas |
| `border-white/[0.06]` en bordes de tarjeta | Bordes blancos a opacidad plena |
| Un CTA principal por pantalla | Dos botones teal lado a lado |
| `transition` en cada elemento interactivo | Estados hover estáticos |
| `active:scale-[0.98]` en botones | Sin feedback al pulsar |

---

## 8. Comportamiento responsive

| Breakpoint | Comportamiento |
|---|---|
| `sm` (640px+) | Sidebar fijo; más padding en contenido (`sm:px-8`) |
| `md` (768px+) | Grid de juegos a 2 columnas |
| `lg` (1024px+) | Grid a 3 columnas |
| `xl` (1280px+) | Grid a 4 columnas |

El sidebar **no** se colapsa en móvil en la implementación actual (limitación conocida, mejora futura).

Áreas táctiles: mínimo `p-2` en interactivos; botones al menos `py-2.5`.

---

## 9. Guía para IA / agentes

Al generar o editar componentes UI, mantener:

**Referencia rápida de color:**

- Fondo: `bg-brand-bg` (`#0B1120`)
- Panel/tarjeta: `bg-brand-panel` (`#161D2F`)
- Input: `bg-brand-input` (`#0F172A`)
- Acento: `brand-accent` / `brand-tealBtn` (`#2DD4BF` / `#36D7B7`)
- Jerarquía de texto: `text-white` → `text-slate-200` → `text-slate-400` → `text-slate-500`

**Clases reutilizables (`index.css`):**

- `.figma-panel` — contenedor de tarjeta/panel
- `.figma-input` — campo de texto
- `.figma-btn-primary` — botón CTA teal (texto negro)
- `.figma-btn-outline` — botón secundario
- `.figma-table-wrap` — contenedor de tabla admin

**Plantilla de prompt:**

> «Crea un componente React para MyPlaythrough siguiendo el tema oscuro de DESIGN_ES.md. Usa `bg-brand-bg` como fondo de página, `figma-panel` para paneles, `figma-input` para campos y `figma-btn-primary` para la acción principal. Jerarquía: `text-white` en títulos, `text-slate-200` en cuerpo, `text-slate-400` en etiquetas.»
