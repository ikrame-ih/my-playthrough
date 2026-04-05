# MyPlaythrough

A web app for managing your personal video game collection. No ads, no noise, no features you don't need.

Platforms like HowLongToBeat or Backloggd are useful, but they tend to get cluttered. MyPlaythrough is a cleaner alternative: track your library, log what you're playing, what you've finished, and what's sitting in your backlog — and optionally see what others in the community are playing.

> Final intermodular project — Higher Degree in Web Application Development (DAW) · CESUR Málaga Este · 2025/2026.

---

## Tech stack

**PERN** — PostgreSQL · Express · React · Node.js

| Layer    | Technology                                     |
| -------- | ---------------------------------------------- |
| Frontend | React 18, Vite, Tailwind CSS, React Router DOM |
| Backend  | Node.js, Express 5                             |
| Database | PostgreSQL                                     |
| Auth     | JWT (`user` / `admin` roles)                   |
| Covers   | Steam public API + RAWG (optional key)         |

---

## Features

- **Personal collection** — add, edit, and delete games (status, platform, score, hours played).
- **Cover art search** — combines Steam and [RAWG](https://rawg.io/apidocs) (`RAWG_API_KEY` optional but recommended for non-Steam titles like Nintendo games). Images are served through a server-side proxy to avoid Steam CDN hotlink blocks in the browser.
- **Shared catalogue** — a `catalogo_juegos` table links each user entry to a canonical RAWG/Steam ID so the same title shares artwork across users when picked from the search.
- **Community** — member list, read-only public profiles, aggregated stats (average score per title via SQL `GROUP BY`).
- **Discussion threads** — threaded comments per game entry (`/juego/:id/discussion`). Authors, game owners, and admins can delete comments.
- **Admin panel** — list users, delete accounts, and moderate any game entry. Role is verified against the database on every request (not just the JWT payload), so SQL promotions take effect immediately after re-login.
- **Roles** — visitor (login wall), registered user, administrator.

---

## Server architecture

The backend follows a three-tier architecture with a clear separation of concerns:

```
server/
├── index.js               # Entry point: global middleware + route mounting
├── config/
│   └── db.js              # PostgreSQL connection pool
├── middleware/
│   └── auth.middleware.js # authMiddleware + adminMiddleware (JWT)
├── utils/
│   ├── normalize.js       # Pure helper functions (normalize email, title, status…)
│   ├── queries.js         # Reusable SQL queries
│   └── covers.js          # Cover search logic (RAWG + Steam + upsert)
└── routes/
    ├── auth.routes.js      # /api/auth/*
    ├── games.routes.js     # /api/games/* + comments
    ├── users.routes.js     # /api/users/*
    ├── community.routes.js # /api/community/*
    ├── admin.routes.js     # /api/admin/*
    └── covers.routes.js    # /api/covers/proxy + /api/games/cover-search
```

---

## Project structure

```
MyPlaythrough/
├── client/   # React + Vite SPA
├── server/   # Express REST API
└── docs/     # SQL migration scripts (run in pgAdmin / psql)
```

---

## Local setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or use the included Docker Compose setup)

### Option A — Docker (recommended for evaluation)

```bash
docker compose up --build
```

This starts the API on port 3000 and PostgreSQL on port 5432. Then run the SQL migrations (see below) in pgAdmin or `psql`.

### Option B — Manual setup

**Backend**

```bash
cd server
npm install
```

Copy `server/.env.example` to `server/.env` and fill in your values:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=myplaythrough
DB_PASSWORD=your_password
DB_PORT=5432
PORT=3000

# Required — the server will not start without this.
JWT_SECRET=replace_with_a_long_random_string

# The frontend origin. Requests from other origins are blocked (CORS).
CORS_ORIGIN=http://localhost:5173

# Optional but recommended — get a free key at https://rawg.io/apidocs
# Without it, only Steam results are returned (Nintendo / console titles won't appear).
RAWG_API_KEY=
```

```bash
npm run dev        # starts with nodemon on port 3000
```

**Frontend**

```bash
cd client
npm install
npm run dev        # starts Vite dev server on port 5173
```

If the API is not at the default address, create `client/.env`:

```env
VITE_API_URL=http://localhost:3000
```

### Database migrations (run in order)

Run these scripts in PostgreSQL — Query Tool in pgAdmin works fine:

1. `docs/add-url-imagen-juegos.sql` — `url_imagen` column on `juegos`
2. `docs/add-catalogo-juegos.sql` — `catalogo_juegos` table + FK on `juegos`
3. `docs/add-juego-comentarios.sql` — `juego_comentarios` table for discussion threads
4. `docs/fix-juegos-titulo-unique.sql` — only needed if an old `UNIQUE` on `titulo` blocks edits
5. `docs/promover-admin.sql` — promote a user to `admin` by email (optional)

> After changing a user's `rol` in SQL, the user must sign in again to get a fresh token with the new role.

---

## API reference

| Method       | Route                                         | Description                             | Auth  |
| ------------ | --------------------------------------------- | --------------------------------------- | ----- |
| GET          | `/api/test-db`                                | DB health check (dev only)              | —     |
| POST         | `/api/auth/register`                          | Create account                          | —     |
| POST         | `/api/auth/login`                             | Sign in, returns JWT                    | —     |
| GET          | `/api/auth/me`                                | Current user (role from DB)             | ✓     |
| GET          | `/api/games`                                  | Logged-in user's collection             | ✓     |
| GET          | `/api/games/:id`                              | Single game detail (owner only)         | ✓     |
| POST         | `/api/games`                                  | Add game                                | ✓     |
| PUT          | `/api/games/:id`                              | Update game                             | ✓     |
| DELETE       | `/api/games/:id`                              | Delete own game                         | ✓     |
| GET          | `/api/games/cover-search?q=`                  | Cover art search (Steam + RAWG)         | ✓     |
| GET          | `/api/covers/proxy?u=`                        | Image proxy (allowlisted CDN hosts)     | —     |
| GET          | `/api/users`                                  | Community member list                   | ✓     |
| GET          | `/api/users/:userId/games`                    | Public collection of another user       | ✓     |
| GET          | `/api/community/stats`                        | Global average scores per title         | ✓     |
| GET          | `/api/community/games/:id`                    | Public game card (for discussion)       | ✓     |
| GET / POST   | `/api/games/:gameId/comments`                 | Read / post comments                    | ✓     |
| DELETE       | `/api/games/:gameId/comments/:commentId`      | Delete comment                          | ✓     |
| GET / DELETE | `/api/admin/users` · `/api/admin/users/:id`   | Admin: user management                  | Admin |
| GET / DELETE | `/api/admin/games` · `/api/admin/games/:id`   | Admin: moderate all game entries        | Admin |

---

## Security overview

| Control                    | Implementation                                                  |
| -------------------------- | --------------------------------------------------------------- |
| SQL injection              | Parameterized queries (`pg` library) throughout                 |
| Password storage           | bcrypt (cost factor 10)                                         |
| Authentication             | JWT — required on all private routes via `authMiddleware`       |
| Authorization              | Role verified from DB on every admin request (not JWT-cached)   |
| CORS                       | Restricted to `CORS_ORIGIN` env variable                        |
| JWT secret                 | Mandatory env variable — server refuses to start without it     |
| Request body size          | Limited to 50 kb (`express.json({ limit: "50kb" })`)            |
| Image proxy host allowlist | Only known CDN domains accepted (`ALLOWED_COVER_HOSTS`)         |
| Diagnostic endpoint        | `/api/test-db` returns 404 when `NODE_ENV=production`           |

---

## Status

All core requirements implemented: authentication, personal collection (CRUD), catalogue-backed cover art, community profiles, aggregated statistics, discussion threads, and admin moderation panel.
