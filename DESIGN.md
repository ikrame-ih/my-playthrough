# DESIGN.md — MyPlaythrough

Notes on how the UI is supposed to look and which Tailwind tokens/classes to reuse. Tokens live in `client/tailwind.config.js`; shared component classes in `client/src/index.css`.

---

## Visual theme

Dark neon HUD: matte panels, subtle grid, cyan/violet accents. Cover art stays the hero — the chrome stays quiet.

- **Mood**: focused, modern, slightly arcade without clutter.
- **Density**: medium. Cards breathe; forms aren't cramped.
- **Accents**: cyan = action, magenta = scores. No decorative chrome.
- **Fonts**: Space Grotesk (headings), Plus Jakarta Sans (body), JetBrains Mono (stats).

---

## Color palette

All colors are defined as Tailwind custom tokens in `client/tailwind.config.js`.

| Token            | Hex       | Role                               |
| ---------------- | --------- | ---------------------------------- |
| `brand-bg`       | `#0B0E14` | Page background — deep matte       |
| `brand-panel`    | `#11151E` | Card and panel surface             |
| `brand-input`    | `#0F141C` | Input field background             |
| `brand-surface`  | `#1A1F2B` | Hover states, subtle separators    |
| `brand-surface2` | `#2A3142` | Interactive borders                |
| `brand-accent`   | `#00F5FF` | Primary accent — neon cyan         |
| `brand-tealBtn`  | `#00F5FF` | Primary CTA fill (alias)           |
| `brand-blue`     | `#7000FF` | Secondary accent — electric violet |
| `brand-magenta`  | `#FF00E5` | Scores and alerts only             |
| `brand-line`     | `#1E2533` | Hairline borders                   |

### Semantic usage

- **Cyan** (`brand-accent` / `brand-tealBtn`) — primary actions, active states, focus rings, links.
- **Violet** (`brand-blue`) — secondary CTAs (`.figma-btn-violet`).
- **Magenta** — score display and destructive hover accents on cards. Never generic UI chrome.
- **Red** — destructive actions (delete) only.
- **White** — headings and card titles.
- **Slate-200** — default body text.

### Background

Layered cyan / magenta / violet radials plus an optional 48px grid (`body::before` in `index.css`). Cover art remains the visual hero.

---

## Typography

| Role    | Stack                 | Usage                                      |
| ------- | --------------------- | ------------------------------------------ |
| Display | **Space Grotesk**     | h1–h3 (global rule in `index.css`)         |
| Body    | **Plus Jakarta Sans** | Default UI copy                            |
| Mono    | **JetBrains Mono**    | Stats, badges, `.tabular-nums`, `.eyebrow` |

| Element              | Classes                                                      | Usage                   |
| -------------------- | ------------------------------------------------------------ | ----------------------- |
| Page title (H1)      | `text-3xl font-bold tracking-tight text-white sm:text-4xl`   | Dashboard header        |
| Section heading (H2) | `text-xl font-bold tracking-tight text-white`                | Panel headers           |
| Card title (H3)      | `text-base font-bold leading-snug tracking-tight text-white` | Game card title         |
| Body text            | `text-sm text-slate-200`                                     | Descriptions, body copy |
| Label / caption      | `text-sm font-medium text-slate-400`                         | Form labels             |
| Badge / tag          | `text-[0.65rem] font-bold uppercase tracking-wide`           | Status badges           |

**Rules** (learned the hard way on game cards):

- Headings always use `tracking-tight`. Never `tracking-normal` for titles.
- `font-bold` for titles and CTAs. `font-medium` for labels. `font-semibold` for secondary actions.
- `line-clamp-2` on card titles to keep grids aligned.
- Numeric values (hours, scores) use `tabular-nums` to prevent layout shift.

---

## Components

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

| Status (DB)  | Label shown | Classes                                          |
| ------------ | ----------- | ------------------------------------------------ |
| `Jugando`    | JUGANDO     | `bg-brand-tealBtn text-black border-transparent` |
| `Completado` | COMPLETADO  | `bg-brand-tealBtn text-black border-transparent` |
| `Pendiente`  | BACKLOG     | `bg-slate-700/80 text-slate-200 border-white/10` |

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

## Layout

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

## Depth and shadows

| Level         | Shadow token      | Usage                            |
| ------------- | ----------------- | -------------------------------- |
| Base card     | `shadow-figma`    | Default card and panel elevation |
| Elevated card | `shadow-figma-lg` | Hover state, modals              |

Shadow definitions:

```js
figma:    "0 4px 24px -4px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)"
figma-lg: "0 12px 40px -8px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05)"
```

The second layer (`0 0 0 1px rgba(255,255,255,...)`) creates the subtle bright border that makes dark cards "pop" against the dark background — this is the key technique for dark UI depth.

---

## Do's and don'ts

| ✅ Do                                     | ❌ Don't                                               |
| ----------------------------------------- | ------------------------------------------------------ |
| Use `rounded-2xl` for panels and cards    | Mix `rounded-lg` and `rounded-2xl` in the same context |
| `text-white` for headings only            | Use `text-white` for body text (use `text-slate-200`)  |
| Black text on teal buttons                | White text on teal buttons                             |
| `tracking-tight` on all headings          | Default tracking on H1–H3                              |
| `tabular-nums` for scores and hours       | Variable-width numbers in aligned columns              |
| `border-white/[0.06]` for card borders    | Full-opacity white borders                             |
| One primary CTA per screen                | Two teal buttons side by side                          |
| `transition` on every interactive element | Static hover states                                    |
| `active:scale-[0.98]` on buttons          | No press feedback                                      |

---

## Responsive notes

| Breakpoint     | Behavior                                                     |
| -------------- | ------------------------------------------------------------ |
| `sm` (640px+)  | Sidebar remains fixed; content padding increases (`sm:px-8`) |
| `md` (768px+)  | Game grid switches to 2 columns                              |
| `lg` (1024px+) | Game grid at 3 columns                                       |
| `xl` (1280px+) | Game grid at 4 columns                                       |

The sidebar does not collapse on mobile in the current implementation (known limitation, noted as future improvement).

Touch targets: all interactive elements have a minimum of `p-2` padding. Buttons use at least `py-2.5` for adequate touch area.

---

## Quick reference

Handy when adding a screen — not a checklist for every PR.

**Colors:**

- Background: `bg-brand-bg` (`#0B0E14`)
- Panel/card surface: `bg-brand-panel` (`#11151E`)
- Input background: `bg-brand-input` (`#0F141C`)
- Primary accent: `brand-accent` / `brand-tealBtn` (`#00F5FF`)
- Secondary accent: `brand-blue` (`#7000FF`)
- Scores only: `brand-magenta` (`#FF00E5`)
- Text hierarchy: `text-white` → `text-slate-200` → `text-slate-400` → `text-slate-500`

**Reusable CSS classes (defined in `index.css`):**

- `.figma-panel` — card / panel container
- `.figma-input` — text field
- `.figma-btn-primary` — cyan CTA button (dark text)
- `.figma-btn-violet` — secondary CTA
- `.figma-btn-outline` — secondary ghost button
- `.figma-table-wrap` — admin table container
