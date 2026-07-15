# MyPlaythrough

[![Live demo](https://img.shields.io/badge/Live_demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://my-playthrough.vercel.app)
[![Docs](https://img.shields.io/badge/Docs-6366f1?style=for-the-badge&logo=github)](https://ikrame-ih.github.io/my-playthrough/)

**Personal video game library manager** — track backlog, active play, and completions. Community features: follow players, share recommendations, threaded discussions, and LFG posts.

Final intermodular project for **Higher Vocational Training in Web Application Development** (2025/2026), **awarded the maximum grade**. Full-stack PERN stack with JWT auth, Docker local stack, and production deployment on **Vercel + Render**.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

| | |
| --- | --- |
| **Live demo** | [my-playthrough.vercel.app](https://my-playthrough.vercel.app) — use **Use demo account** or sign in with seeded users |
| **Documentation** | [GitHub Pages](https://ikrame-ih.github.io/my-playthrough/) — [defense deck](https://ikrame-ih.github.io/my-playthrough/defense/) |
| **Source** | [github.com/ikrame-ih/my-playthrough](https://github.com/ikrame-ih/my-playthrough) |
| **Run locally** | Docker Compose or manual Postgres + `client/` + `server/` |
| **Deployment** | [docs/DEPLOY.md](docs/DEPLOY.md) — Vercel (frontend) + Render (API + Postgres) |

## Highlights

- **Personal collection** — CRUD for games (status, platform, score, hours) with grid/list views
- **Cover art search** — Steam + [RAWG](https://rawg.io/apidocs) via server-side proxy
- **Community** — member list, global stats, activity feed, LFG (looking for group)
- **Recommendations** — send library titles to followed users; header bell with unread count
- **Discussions** — nested comments with Steam-style helpful / not recommended votes
- **Admin panel** — user, game, and LFG moderation with strict deletion confirmation
- **Security** — JWT + bcrypt, parameterized SQL, CORS, rate-limited auth, 50 KB JSON limit
- **Demo account** — one-click sign-in after `npm run seed:demo` (works locally and on the live demo)

## Preview

Captured at 1440×900 from the local stack. Regenerate with `node scripts/capture-readme-screenshots.mjs` (client + API running; run `npm run seed:presentation` first for community data).

<table>
  <tr>
    <td width="50%">
      <a href="docs/screenshots/02-collection.png"><img src="docs/screenshots/02-collection.png" alt="My collection" width="100%" /></a>
      <br /><sub><b>Collection</b></sub>
    </td>
    <td width="50%">
      <a href="docs/screenshots/03-community-members.png"><img src="docs/screenshots/03-community-members.png" alt="Community" width="100%" /></a>
      <br /><sub><b>Community</b></sub>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <a href="docs/screenshots/07-add-game.png"><img src="docs/screenshots/07-add-game.png" alt="Add game" width="100%" /></a>
      <br /><sub><b>Add game</b></sub>
    </td>
    <td width="50%">
      <a href="docs/screenshots/09-recommendations.png"><img src="docs/screenshots/09-recommendations.png" alt="Recommendations" width="100%" /></a>
      <br /><sub><b>Recommendations</b></sub>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <a href="docs/screenshots/11-discussion.png"><img src="docs/screenshots/11-discussion.png" alt="Discussion" width="100%" /></a>
      <br /><sub><b>Discussion</b></sub>
    </td>
    <td width="50%">
      <a href="docs/screenshots/01-auth.png"><img src="docs/screenshots/01-auth.png" alt="Sign in" width="100%" /></a>
      <br /><sub><b>Sign in</b></sub>
    </td>
  </tr>
</table>

More captures in [`docs/screenshots/`](docs/screenshots/) and on [GitHub Pages](https://ikrame-ih.github.io/my-playthrough/).

## Quick start

**Prerequisites:** Node.js 18+ and PostgreSQL 14+, or Docker.

### Option A — Docker (recommended)

```bash
git clone https://github.com/ikrame-ih/my-playthrough.git
cd my-playthrough
docker compose up --build
```

API on **http://localhost:3000**. Postgres on host port **5433**.

### Option B — Manual

1. **Database** — create a DB and run `docs/sql/schema.sql` once.
2. **Backend** — `cd server`, `npm install`, copy `.env.example` → `.env`, set `DB_*`, `JWT_SECRET`, `CORS_ORIGIN`, optional `RAWG_API_KEY`. Run `npm run dev`.
3. **Frontend** — `cd client`, `npm install`, copy `.env.example` → `.env` if the API is not on port 3000. Run `npm run dev` (port **5173**).

### Demo data (optional)

From `server/`:

```bash
npm run seed:demo          # demo user + 3 games (idempotent)
npm run seed:presentation  # full sample dataset for local demos
```

Demo credentials: **`demo@myplaythrough.local`** / **`Presentacion2026!`** — or **Use demo account** on the login screen.

For a fuller community preview (members, comments, recommendations), run `npm run seed:presentation` (same password for all seeded users).

## Production deployment

The app is live at **[my-playthrough.vercel.app](https://my-playthrough.vercel.app)**.

| Service | Platform |
| --- | --- |
| Frontend (React SPA) | [Vercel](https://vercel.com) — root directory `client` |
| API (Express) | [Render](https://render.com) — `render.yaml` Blueprint |
| Database | Render PostgreSQL |

Step-by-step setup, env vars, and seeding production: **[docs/DEPLOY.md](docs/DEPLOY.md)**.

## Scripts

| Command | Where | Purpose |
| --- | --- | --- |
| `npm run dev` | `client/` · `server/` | Dev servers |
| `npm run build` | `client/` | Production SPA build |
| `npm test` | `client/` · `server/` | Vitest unit tests |
| `npm run seed:demo` | `server/` | Idempotent demo user + games |
| `npm run seed:presentation` | `server/` | Full presentation dataset |

**CI:** GitHub Pages deploys docs + defense deck on push to `main`.

## Stack

React 18 · Vite 7 · Tailwind CSS 3 · React Router 7 · Node.js · Express 5 · PostgreSQL · JWT · bcrypt · Vitest · Docker Compose

## Environment

Copy `.env.example` → `.env` in `server/` (and `client/` if the API URL differs).

| Variable | Purpose |
| --- | --- |
| `DB_*` / `DATABASE_URL` | PostgreSQL connection (local `DB_*`; cloud `DATABASE_URL`) |
| `JWT_SECRET` | Auth token signing |
| `CORS_ORIGIN` | Allowed frontend origin(s) |
| `RAWG_API_KEY` | Cover art search (recommended) |
| `VITE_API_URL` | API base URL in `client/` (required for Vercel builds) |

Never commit `.env` files or secrets.

## Project layout

```
client/          # React SPA (Vite)
server/          # Express REST API
docs/            # SQL schema, test plan, HTML diagrams, screenshots
presentation/    # Defense slide deck (built into GitHub Pages)
brand/           # Brand book export
```

## API overview

| Method | Route | Description | Auth |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Create account | — |
| POST | `/api/auth/login` | Sign in | — |
| POST | `/api/auth/demo` | Demo sign-in | — |
| GET | `/api/auth/me` | Current user | ✓ |
| PATCH | `/api/auth/me` | Update profile | ✓ |
| CRUD | `/api/games` | Collection | ✓ |
| GET | `/api/users` | Community members | ✓ |
| * | `/api/social/*` | Follows, recommendations, LFG | ✓ |
| * | `/api/admin/*` | Moderation | admin |

Full route definitions: `server/routes/`.

## Documentation

- [Project defense deck](https://ikrame-ih.github.io/my-playthrough/defense/) — arrow keys / space; animations included
- [Architecture & diagrams](https://ikrame-ih.github.io/my-playthrough/)
- [Manual test plan](docs/test-plan.md) — [printable HTML](https://ikrame-ih.github.io/my-playthrough/abrir-en-navegador/plan_pruebas.html)
- UI design tokens: [`DESIGN.md`](DESIGN.md)

## License

© 2026 Ikrame Ibn Hayoun. Source code available in this repository for academic and portfolio review.

## Author

**Ikrame Ibn Hayoun** — [Portfolio](https://ikrame-ih.vercel.app/) · [GitHub](https://github.com/ikrame-ih) · [LinkedIn](https://www.linkedin.com/in/ikrame-ih/)
