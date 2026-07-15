# Project documentation (`docs/`)

Setup and API overview: root [`README.md`](../README.md).

**Live demo:** [my-playthrough.vercel.app](https://my-playthrough.vercel.app) · **Deployment guide:** [`DEPLOY.md`](DEPLOY.md)

**Online docs:** [GitHub Pages](https://ikrame-ih.github.io/my-playthrough/) — defense deck, diagrams, test plan.

Full test plan: [`abrir-en-navegador/plan_pruebas.html`](abrir-en-navegador/plan_pruebas.html) (print to PDF). Markdown source: [`test-plan.md`](test-plan.md). **58** manual cases (46 P-, 8 S-, 4 V-) plus **27** Vitest unit tests.

---

## HTML pages (`abrir-en-navegador/`)

Browser-ready pages with their own styles:

| File | Content |
| ---- | ------- |
| [`diagrama_bd.html`](abrir-en-navegador/diagrama_bd.html)                     | Data model: entity blocks, foreign keys, column detail                       |
| [`flujo_pern_tres_capas.html`](abrir-en-navegador/flujo_pern_tres_capas.html) | Three stacked layers (presentation / business / persistence), flow steps 1–8 |
| [`funciones_principales.html`](abrir-en-navegador/funciones_principales.html) | Key code functions, course topics (JWT, middleware, HTTP), file references   |
| [`plan_pruebas.html`](abrir-en-navegador/plan_pruebas.html)                   | Full test plan — printable layout                                            |

---

## SQL scripts (`sql/`)

| Content              | Path                                                             |
| -------------------- | ---------------------------------------------------------------- |
| Full database schema | [`sql/schema.sql`](sql/schema.sql)                               |
| Migrations           | `sql/add-*.sql`, `sql/fix-*.sql`, `sql/promover-admin.sql`, etc. |

The schema in `sql/schema.sql` matches the diagram in `diagrama_bd.html`. Migrations can be applied from `server/` via `npm run migrate:*`.

---

**UI notes:** [`DESIGN.md`](../DESIGN.md) at the repo root.
