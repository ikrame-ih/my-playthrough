# DESIGN.md — MyPlaythrough

Design system reference for the MyPlaythrough web application.  
Use this document to ensure visual consistency across all screens and components.

---

## 1. Visual Theme & Atmosphere

MyPlaythrough uses a **dark digital library** aesthetic. The interface is intentionally quiet — the game cover art is the hero. Everything else steps back.

- **Mood**: calm, focused, modern. No gradients fighting for attention.
- **Density**: medium. Cards breathe; forms aren't cramped.
- **Philosophy**: "less is more". One accent color. Two surface levels. No decorative elements that don't carry meaning.
- **Inspiration**: the dark-mode library experience of Spotify and the technical precision of Linear — but warmer and gaming-first.

---

## 2. Color Palette

All colors are defined as Tailwind custom tokens in `tailwind.config.js`.

| Token | Hex | Role |
|---|---|---|
| `brand-bg` | `#0B1120` | Page background — deep matte navy |
| `brand-panel` | `#161D2F` | Card and panel surface |
| `brand-input` | `#0F172A` | Input field and secondary button background |
| `brand-surface` | `#1E293B` | Hover states, subtle separators |
| `brand-surface2` | `#334155` | Borders on interactive elements |
| `brand-accent` | `#2DD4BF` | Primary brand accent — Vibrant Teal |
| `brand-tealBtn` | `#36D7B7` | CTA button fill (slightly brighter variant) |
| `brand-blue` | `#007BFF` | Secondary accent — Electric Blue |
| `white` | `#FFFFFF` | Primary text |
| `slate-200` | `#E2E8F0` | Default body text |
| `slate-400` | `#94A3B8` | Secondary / label text |
| `slate-500` | `#64748B` | Placeholder and disabled text |
| `amber-400` | `#FBBF24` | Score star — warm gold |
| `red-400` | `#F87171` | Destructive action hover |

### Semantic usage

- **Teal** (`brand-accent` / `brand-tealBtn`) — primary actions, active states, score badges, brand moments.
- **Blue** (`brand-blue`) — links, secondary interactive elements.
- **Amber** — score display only. Never used for UI actions.
- **Red** — destructive actions (delete button hover) only. Never informational.
- **White** — headings and card titles only.
- **Slate-200** — default text weight.

### Background radial glow

The page applies a subtle teal radial gradient at the top center to add depth without being distracting:

```css
background-image: radial-gradient(
  ellipse 90% 60% at 50% -15%,
  rgba(45, 212, 191, 0.09),
  transparent 55%
);
```

---

## 3. Typography

**Font stack:** `Inter`, `DM Sans`, `system-ui`, `Segoe UI`, `sans-serif`

Inter is preferred. The system-ui fallback ensures the app looks clean even without web fonts.

| Element | Classes | Usage |
|---|---|---|
| Page title (H1) | `text-3xl font-bold tracking-tight text-white sm:text-4xl` | Dashboard header |
| Section heading (H2) | `text-xl font-bold tracking-tight text-white` | Panel headers |
| Card title (H3) | `text-base font-bold leading-snug tracking-tight text-white` | Game card title |
| Body text | `text-sm text-slate-200` | Descriptions, body copy |
| Label / caption | `text-sm font-medium text-slate-400` | Form labels, secondary info |
| Badge / tag | `text-[0.65rem] font-bold uppercase tracking-wide` | Status badges, platform chip |
| Nav item | `text-sm font-medium` | Sidebar navigation links |

**Rules:**
- Headings always use `tracking-tight`. Never `tracking-normal` for titles.
- `font-bold` for titles and CTAs. `font-medium` for labels. `font-semibold` for secondary actions.
- `line-clamp-2` on card titles to keep grids aligned.
- Numeric values (hours, scores) use `tabular-nums` to prevent layout shift.

---

## 4. Component Library

### Panels / Cards — `.figma-panel`

```css
rounded-2xl border border-white/[0.08] bg-brand-panel shadow-figma ring-1 ring-white/[0.04]
```

The double border (`border` + `ring`) creates a subtle 3D depth effect on dark surfaces. Always use `rounded-2xl` for panels, never `rounded-xl` or `rounded-lg`.

### Inputs — `.figma-input`

```css
w-full rounded-lg border border-white/10 bg-brand-input px-4 py-3 text-white
placeholder:text-slate-500 transition
focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/25
```

Focus state: teal border + 25% opacity teal ring glow. Never blue focus rings.

### Primary button — `.figma-btn-primary`

```css
inline-flex items-center justify-center gap-2 rounded-lg
bg-brand-tealBtn px-5 py-2.5 text-sm font-bold text-black
shadow-lg shadow-teal-900/25 transition
hover:brightness-95 active:scale-[0.98]
```

- Black text on teal — always. Never white text on teal (contrast issue).
- `active:scale-[0.98]` gives tactile press feedback.
- Use `py-3.5` on full-width auth buttons for a larger touch target.

### Outline button — `.figma-btn-outline`

```css
inline-flex w-full items-center justify-center rounded-lg
border border-white/10 bg-brand-input py-3 text-sm font-semibold text-white
transition hover:bg-white/[0.04]
```

Used for secondary actions (switch auth mode, cancel).

### Game Card — `<GameCard />`

Structure: `rounded-2xl` container → `h-44` cover image area → `p-5` content area.

States:
- **Default**: `border-white/[0.06]`, `shadow-figma`
- **Hover**: `-translate-y-0.5`, `border-brand-accent/20`, `shadow-figma-lg` (triggered by `group-hover`)

Cover image fallback: gradient `from-slate-800 to-slate-950` with centered initial letter in `text-white/[0.08]`.

Platform chip: `bg-black/55 backdrop-blur-sm` — positioned `top-3 left-3` over the cover image.

### Status badge

| Status (DB) | Label shown | Classes |
|---|---|---|
| `Jugando` | JUGANDO | `bg-brand-tealBtn text-black border-transparent` |
| `Completado` | COMPLETADO | `bg-brand-tealBtn text-black border-transparent` |
| `Pendiente` | BACKLOG | `bg-slate-700/80 text-slate-200 border-white/10` |

Note: the UI displays "BACKLOG" for `Pendiente` entries (gameLabels.js). Teal badges = active/positive states. Grey badge = queued/inactive.

### Sidebar navigation — `<AppShell />`

Width: fixed `260px`.  
Background: `#0a0f1a` (slightly darker than `brand-bg`).  
Border: `border-r border-white/[0.06]`.

Nav link states:
- **Active**: `bg-white/[0.08] text-brand-accent shadow-inner shadow-black/20`
- **Inactive**: `text-slate-400`
- **Hover (inactive)**: `bg-white/[0.04] text-slate-200`

### Top bar (search + avatar)

`sticky top-0 z-30 bg-brand-bg/90 backdrop-blur-lg border-b border-white/[0.06]`

The `backdrop-blur-lg` keeps the bar readable when content scrolls behind it.

Avatar: `rounded-full border-2 border-brand-accent/50 bg-gradient-to-br from-slate-800 to-slate-900` — displays first letter of username.

### Tables (Admin panel) — `.figma-table-wrap`

```css
overflow-x-auto rounded-2xl border border-white/[0.08] bg-brand-panel shadow-figma ring-1 ring-white/[0.04]
```

Table headers: `text-xs font-semibold uppercase tracking-wider text-slate-500`.  
Row dividers: `divide-y divide-white/[0.05]`.  
Row hover: `hover:bg-white/[0.03]`.

### Error / alert banners

```css
rounded-lg border border-red-500/35 bg-red-950/35 px-4 py-3 text-sm text-red-100
```

Always include `role="alert"` for accessibility.

---

## 5. Layout Principles

### Page structure

```
┌─────────────────────────────────────────────────────┐
│  Sidebar (260px fixed)  │  Top bar (sticky)          │
│  ─────────────────────  │  ─────────────────────     │
│  Logo                   │  Search input   [Avatar]   │
│  Nav links              │                            │
│                         │  Main content area         │
│  [Logout]               │  max-w-7xl px-6 py-8       │
└─────────────────────────────────────────────────────┘
```

### Content area

`mx-auto w-full max-w-7xl flex-1 px-6 py-8 sm:px-8 sm:py-10`

### Game grid

`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5`

Cards use consistent `gap-5` (20px). Never mix `gap-4` and `gap-6` in the same grid.

### Form layout

`flex flex-col gap-5` between form fields.  
`mb-1.5` between label and input.  
Labels always above inputs, never inline or placeholder-only.

---

## 6. Depth & Elevation

| Level | Shadow token | Usage |
|---|---|---|
| Base card | `shadow-figma` | Default card and panel elevation |
| Elevated card | `shadow-figma-lg` | Hover state, modals |

Shadow definitions:

```js
figma:    "0 4px 24px -4px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)"
figma-lg: "0 12px 40px -8px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05)"
```

The second layer (`0 0 0 1px rgba(255,255,255,...)`) creates the subtle bright border that makes dark cards "pop" against the dark background — this is the key technique for dark UI depth.

---

## 7. Do's and Don'ts

| ✅ Do | ❌ Don't |
|---|---|
| Use `rounded-2xl` for panels and cards | Mix `rounded-lg` and `rounded-2xl` in the same context |
| `text-white` for headings only | Use `text-white` for body text (use `text-slate-200`) |
| Black text on teal buttons | White text on teal buttons |
| `tracking-tight` on all headings | Default tracking on H1–H3 |
| `tabular-nums` for scores and hours | Variable-width numbers in aligned columns |
| `border-white/[0.06]` for card borders | Full-opacity white borders |
| One primary CTA per screen | Two teal buttons side by side |
| `transition` on every interactive element | Static hover states |
| `active:scale-[0.98]` on buttons | No press feedback |

---

## 8. Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| `sm` (640px+) | Sidebar remains fixed; content padding increases (`sm:px-8`) |
| `md` (768px+) | Game grid switches to 2 columns |
| `lg` (1024px+) | Game grid at 3 columns |
| `xl` (1280px+) | Game grid at 4 columns |

The sidebar does not collapse on mobile in the current implementation (known limitation, noted as future improvement).

Touch targets: all interactive elements have a minimum of `p-2` padding. Buttons use at least `py-2.5` for adequate touch area.

---

## 9. Agent Prompt Guide

When generating or editing UI components for this project, keep these rules in mind:

**Quick color reference:**
- Background: `bg-brand-bg` (`#0B1120`)
- Panel/card surface: `bg-brand-panel` (`#161D2F`)
- Input background: `bg-brand-input` (`#0F172A`)
- Primary accent: `brand-accent` / `brand-tealBtn` (`#2DD4BF` / `#36D7B7`)
- Text hierarchy: `text-white` → `text-slate-200` → `text-slate-400` → `text-slate-500`

**Reusable CSS classes (defined in `index.css`):**
- `.figma-panel` — card / panel container
- `.figma-input` — text field
- `.figma-btn-primary` — teal CTA button (black text)
- `.figma-btn-outline` — secondary ghost button
- `.figma-table-wrap` — admin table container

**Prompt template for new screens:**
> "Create a new React component for MyPlaythrough following the DESIGN.md dark theme. Use `bg-brand-bg` as the page background, `figma-panel` for content panels, `figma-input` for form fields, and `figma-btn-primary` for the main action. Text hierarchy: `text-white` for headings, `text-slate-200` for body, `text-slate-400` for labels."
