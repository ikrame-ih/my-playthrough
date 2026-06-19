# MyPlaythrough

[![Project documentation](https://img.shields.io/badge/Project%20docs-GitHub%20Pages-00F5FF?style=for-the-badge&logo=github)](https://ikrame-ih.github.io/my-playthrough/)

A full-stack web app to manage your personal video game library — track what you are playing, what you have finished, and what is still on your backlog. Optional community features let you follow other players, share recommendations, and find teammates (LFG).

Developed as the **final intermodular project** for the **Higher Vocational Training programme in Web Application Development** (2025/2026), **awarded the maximum grade**.

**Project documentation** (animated project defense deck, architecture diagrams, database model, test plan, screenshots): **[GitHub Pages](https://ikrame-ih.github.io/my-playthrough/)** — start with the [project defense presentation](https://ikrame-ih.github.io/my-playthrough/defense/) (arrow keys / space; animations included).

---

## At a glance

| Area         | Details                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------ |
| **Stack**    | PERN — PostgreSQL, Express 5, React 18, Node.js                                                  |
| **Auth**     | JWT, bcrypt password hashing, role-based access (`user` / `admin`)                               |
| **Security** | Parameterized SQL, CORS, rate-limited auth, 50 KB JSON limit, image proxy allowlist              |
| **UX**       | Skeleton loading, accessible skip link, grid/list collection views, onboarding tour              |
| **Social**   | Follow users, game recommendations inbox, threaded discussions with Steam-style votes, LFG posts |
| **DevOps**   | Docker Compose for local API + Postgres, `render.yaml` for optional cloud API                    |

---

## Screenshots

Captured at 1440×900 from the local stack. Regenerate with `node scripts/capture-readme-screenshots.mjs` (client + API running; run `npm run seed:presentation` first for community data).

<details open>
<summary><strong>UI gallery</strong> — click to collapse</summary>

<table>
<tr>
<td width="50%" align="center"><a href="docs/screenshots/02-collection.png"><img src="docs/screenshots/02-collection.png" alt="My collection" width="100%" /></a><br/><sub><strong>Collection</strong></sub></td>
<td width="50%" align="center"><a href="docs/screenshots/03-community-members.png"><img src="docs/screenshots/03-community-members.png" alt="Community" width="100%" /></a><br/><sub><strong>Community</strong></sub></td>
</tr>
<tr>
<td width="50%" align="center"><a href="docs/screenshots/07-add-game.png"><img src="docs/screenshots/07-add-game.png" alt="Add game" width="100%" /></a><br/><sub><strong>Add game</strong></sub></td>
<td width="50%" align="center"><a href="docs/screenshots/09-recommendations.png"><img src="docs/screenshots/09-recommendations.png" alt="Recommendations" width="100%" /></a><br/><sub><strong>Recommendations</strong></sub></td>
</tr>
<tr>
<td width="50%" align="center"><a href="docs/screenshots/11-discussion.png"><img src="docs/screenshots/11-discussion.png" alt="Discussion" width="100%" /></a><br/><sub><strong>Discussion</strong></sub></td>
<td width="50%" align="center"><a href="docs/screenshots/01-auth.png"><img src="docs/screenshots/01-auth.png" alt="Sign in" width="100%" /></a><br/><sub><strong>Sign in</strong></sub></td>
</tr>
</table>

More captures live in [`docs/screenshots/`](docs/screenshots/) and on [GitHub Pages](https://ikrame-ih.github.io/my-playthrough/).

</details>

---

## Features

- **Personal collection** — CRUD for games (status, platform, score, hours). Success feedback on the home screen after save.
- **Cover art search** — Steam + [RAWG](https://rawg.io/apidocs) via server-side proxy (`RAWG_API_KEY` recommended).
- **Shared catalogue** — canonical game IDs so cover art is reused across users.
- **Community** — member list, global stats, activity feed, LFG (looking for group).
- **Recommendations** — send a library title to users you follow; header bell with unread count.
- **Avatars** — 10 preset robot SVGs, chosen in Profile settings.
- **Discussions** — nested comments per game entry with helpful / not recommended votes.
- **Admin panel** — user/game/LFG moderation with strict account deletion confirmation.
- **Demo account** — one-click sign-in after running the seed script (local development only).

---

## Tech stack

| Layer    | Technology                                       |
| -------- | ------------------------------------------------ |
| Frontend | React 18, Vite 7, Tailwind CSS 3, React Router 7 |
| Backend  | Node.js, Express 5, JWT, bcryptjs                |
| Database | PostgreSQL 14+                                   |
| Tests    | Vitest (client + server)                         |

---

## Project structure

```
my-playthrough/
├── client/          # React SPA (Vite)
├── server/          # Express REST API
├── docs/            # SQL schema, test plan, HTML diagrams, screenshots
├── presentation/    # Defense slide deck (built into GitHub Pages)
└── brand/           # Brand book export
```

---

## Local setup

**Requirements:** Node.js 18+ and PostgreSQL 14+, or Docker.

### Option A — Docker (API + database)

```bash
docker compose up --build
```

API on **http://localhost:3000**. Postgres exposed on host port **5433** (container `5432`).

### Option B — Manual

1. **Database** — create a DB and run `docs/sql/schema.sql` once.
2. **Backend** — `cd server`, `npm install`, copy `.env.example` to `.env`, set `DB_*`, `JWT_SECRET`, `CORS_ORIGIN`, optional `RAWG_API_KEY`. Run `npm run dev`.
3. **Frontend** — `cd client`, `npm install`, copy `.env.example` to `.env` if the API is not on port 3000. Run `npm run dev` (port **5173**).

### Demo data (optional)

From `server/`:

```bash
npm run seed:demo          # demo user + 3 games (idempotent)
npm run seed:presentation  # full sample dataset for local demos
```

Demo credentials after seed: **`demo@myplaythrough.local`** / **`Presentacion2026!`**  
Or use **Use demo account** on the login screen (requires `seed:demo`).

---

## API overview

| Method | Route                | Description                   | Auth  |
| ------ | -------------------- | ----------------------------- | ----- |
| POST   | `/api/auth/register` | Create account                | —     |
| POST   | `/api/auth/login`    | Sign in                       | —     |
| POST   | `/api/auth/demo`     | Demo sign-in                  | —     |
| GET    | `/api/auth/me`       | Current user                  | ✓     |
| PATCH  | `/api/auth/me`       | Update profile                | ✓     |
| CRUD   | `/api/games`         | Collection                    | ✓     |
| GET    | `/api/users`         | Community members             | ✓     |
| \*     | `/api/social/*`      | Follows, recommendations, LFG | ✓     |
| \*     | `/api/admin/*`       | Moderation                    | admin |

Full route definitions live under `server/routes/`.

---

## Security notes

- Passwords hashed with bcrypt (cost 10); policy enforced on client and server.
- Admin role verified from the database on every admin request.
- Auth endpoints rate-limited per IP.
- Production hides `/api/test-db`.

---

## Design

UI design tokens and component patterns: [`DESIGN.md`](DESIGN.md).  
Architecture and diagrams: [GitHub Pages](https://ikrame-ih.github.io/my-playthrough/).

---

## Status

Core features are implemented and documented in the [manual test plan](docs/test-plan.md) (printable HTML on [GitHub Pages](https://ikrame-ih.github.io/my-playthrough/abrir-en-navegador/plan_pruebas.html)).

## License

© 2026 Ikrame Ibn Hayoun. Source code available in this repository for academic and portfolio review.
