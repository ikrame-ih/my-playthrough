# MyPlaythrough

A web app for managing your personal video game collection. No ads, no noise, no features you do not need.

Platforms like HowLongToBeat or Backloggd are useful, but they tend to get cluttered. MyPlaythrough was built as a cleaner alternative: keep track of your library, log what you are playing, what you have finished, and what is sitting in your backlog — and optionally check out what others are playing too.

> Built as the final intermodular project for the Higher Degree in Web Application Development (DAW).

## Stack

**PERN** — PostgreSQL · Express · React · Node.js

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | React 18, Vite, Tailwind CSS, React Router |
| Backend  | Node.js, Express                    |
| Database | PostgreSQL                          |
| Auth     | JWT (`user` / `admin` roles)        |

## Features

- **Collection**: add, edit, and delete games (platform, status, score, hours).
- **Cover art**: search Steam and/or [RAWG](https://rawg.io/apidocs) (optional `RAWG_API_KEY`), pick the correct title; images can be served through a small **server proxy** to avoid Steam CDN hotlink issues in the browser.
- **Shared catalog (Twitch-style)**: optional `catalogo_juegos` table links each entry to a canonical RAWG/Steam id so the same game and artwork are shared across users when they pick from search.
- **Community**: list members, open read-only profiles, aggregated stats (average score per title).
- **Discussion threads**: per–collection entry (`/juego/:id/discussion`) — threaded comments (Reddit-like); authors, game owners, and admins can remove comments.
- **Admin**: user list, delete accounts, list **all** games in the database and delete any entry (moderation). Admin role is enforced using the **current role in PostgreSQL** (not only the JWT), so promoting a user with SQL works after a refresh.
- **Roles**: visitor (login wall), registered user, administrator.

## Project structure

```
MyPlaythrough/
├── client/          # React + Vite SPA
├── server/          # Express API
└── docs/            # SQL migrations and maintenance scripts (run in pgAdmin / psql)
```

## Local setup

### Prerequisites

- Node.js 18+
- PostgreSQL

### Backend

```bash
cd server
npm install
```

Create `server/.env` from `server/.env.example` (database URL, `JWT_SECRET`, optional `RAWG_API_KEY`).

```bash
npm run dev
```

Default API: `http://localhost:3000`

### Frontend

```bash
cd client
npm install
npm run dev
```

Set `client/.env` if the API is not on the default host, e.g. `VITE_API_URL=http://localhost:3000`.

### Database migrations (order)

Run these in PostgreSQL when setting up or upgrading (Query Tool in pgAdmin is fine):

1. `docs/add-url-imagen-juegos.sql` — `url_imagen` on `juegos`
2. `docs/add-catalogo-juegos.sql` — `catalogo_juegos` + `juegos.catalogo_id`
3. `docs/add-juego-comentarios.sql` — `juego_comentarios` for threads
4. `docs/fix-juegos-titulo-unique.sql` — **only if** you have an unwanted `UNIQUE` on `titulo` that blocks edits (see comments inside the file)
5. `docs/promover-admin.sql` — promote a user to `admin` by email (optional)

**Admin tip:** after changing `rol` in SQL, reload the app or sign in again so the client picks up the new role.

## API overview

| Method | Route | Description |
| ------ | ----- | ----------- |
| GET | `/api/test-db` | Health check |
| POST | `/api/auth/register`, `/api/auth/login` | Auth |
| GET | `/api/auth/me` | Current user (role from DB) |
| GET | `/api/games` | Logged-in user’s games |
| GET | `/api/games/:id` | Edit payload (owner only) |
| POST | `/api/games` | Add game (`catalogo_ref` optional) |
| PUT | `/api/games/:id` | Update (`merge_duplicate` optional to remove conflicting row) |
| DELETE | `/api/games/:id` | Delete own game |
| GET | `/api/games/cover-search?q=` | Cover search |
| GET | `/api/covers/proxy?u=` | Image proxy (allowlisted hosts) |
| GET | `/api/community/games/:id` | Public game card for discussion |
| GET/POST | `/api/games/:gameId/comments` | Thread |
| DELETE | `/api/games/:gameId/comments/:commentId` | Remove comment |
| GET | `/api/users`, `/api/users/:userId/games` | Community |
| GET | `/api/community/stats` | Aggregated ratings |
| GET/DELETE | `/api/admin/users`, `/api/admin/users/:id` | Admin |
| GET/DELETE | `/api/admin/games`, `/api/admin/games/:id` | Admin: all games |

## Status

Core requirements are implemented: auth, profiles, community, catalog-backed covers, admin moderation, threaded comments, and optional SQL migrations for production databases.
