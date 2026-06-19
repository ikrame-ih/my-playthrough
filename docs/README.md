# Project documentation (`docs/`)

Index for evaluation materials and repository readers. Installation, environment variables, and API overview are in the root [`README.md`](../README.md).

**Browse online:** [Project documentation on GitHub Pages](https://ikihga2223-create.github.io/MyPlaythrough/) — diagrams, test plan, schema, and screenshots.

For the full test plan, open [`abrir-en-navegador/plan_pruebas.html`](abrir-en-navegador/plan_pruebas.html) in a browser (print to PDF). Markdown source: [`test-plan.md`](test-plan.md). Totals: **58 manual tests** (46 **P-**, 8 **S-**, 4 **V-**) plus **27 unit tests** (Vitest).

---

## HTML documentation (`abrir-en-navegador/`)

Browser-ready pages with their own styles:

| File | Content |
| ---- | ------- |
| [`diagrama_bd.html`](abrir-en-navegador/diagrama_bd.html) | Data model: entity blocks, foreign keys, column detail |
| [`flujo_pern_tres_capas.html`](abrir-en-navegador/flujo_pern_tres_capas.html) | Three stacked layers (presentation / business / persistence), flow steps 1–8 |
| [`funciones_principales.html`](abrir-en-navegador/funciones_principales.html) | Key code functions, DAW course topics (JWT, middleware, HTTP), file references |
| [`plan_pruebas.html`](abrir-en-navegador/plan_pruebas.html) | Full test plan — printable layout |

---

## SQL scripts (`sql/`)

| Content | Path |
| ------- | ---- |
| Full database schema | [`sql/schema.sql`](sql/schema.sql) |
| Migrations | `sql/add-*.sql`, `sql/fix-*.sql`, `sql/promover-admin.sql`, etc. |

The schema in `sql/schema.sql` matches the diagram in `diagrama_bd.html`. Migrations can be applied from `server/` via `npm run migrate:*`.

---

**UI design:** [`DESIGN.md`](../DESIGN.md) and [`DESIGN_ES.md`](../DESIGN_ES.md) at the repository root.

The app UI is **English**. Academic HTML pages may still include Spanish labels where they were written for the defence.
