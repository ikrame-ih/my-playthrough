# MyPlaythrough

<p align="center">
  <a href="#readme-es"><img src="https://img.shields.io/badge/README-Espa%C3%B1ol%20(primero)-2DD4BF?style=for-the-badge&labelColor=0B1120" alt="Español" /></a>
  &nbsp;
  <a href="#readme-en"><img src="https://img.shields.io/badge/README-English%20(below)-64748B?style=for-the-badge&labelColor=0B1120" alt="English" /></a>
</p>

<p align="center"><b>Bilingüe · Bilingual</b><br />
Este README está disponible en <b>español</b> y en <b>inglés</b>.<br />
This README is available in <b>Spanish</b> and <b>English</b> </p>

---

<a id="readme-es"></a>

## Español

Aplicación web para gestionar tu colección personal de videojuegos. Sin publicidad, sin ruido y sin funciones que no necesites.

Plataformas como HowLongToBeat o Backloggd son útiles, pero suelen saturarse. MyPlaythrough es una alternativa más limpia: lleva tu biblioteca, registra en qué juegas, qué has completado y qué tienes pendiente, y opcionalmente consulta qué juegan otros en la comunidad.

> Proyecto intermodular final — Ciclo Formativo de Grado Superior en Desarrollo de Aplicaciones Web (DAW) · CESUR Málaga Este · 2025/2026.

### Idioma y convención (revisión en español)

- **Interfaz de la aplicación** — textos, mensajes y flujos en **español**, para que la evaluación de usabilidad y contenido sea inmediata.
- **Este README** — bloque **Español primero**; el inglés va después para reutilizar el repositorio o ampliar el proyecto sin duplicar código.
- **Código fuente** — nombres de carpetas, archivos, variables y rutas API en **inglés** (convención habitual en PERN y documentación de librerías). Los **comentarios de documentación** (`@description`, rutas) están en **español** en el backend y componentes principales.
- **Carpeta `docs/`** — índice en [`docs/README.md`](docs/README.md): plan de pruebas, SQL y diagramas; los contenidos redactados para memoria están en **español** salvo etiquetas técnicas inevitables.

### Stack tecnológico

**PERN** — PostgreSQL · Express · React · Node.js

| Capa          | Tecnología                                                              |
| ------------- | ----------------------------------------------------------------------- |
| Frontend      | React 18, Vite, Tailwind CSS, React Router DOM                          |
| Backend       | Node.js, Express 5                                                      |
| Base de datos | PostgreSQL                                                              |
| Autenticación | JWT (roles `user` / `admin`)                                            |
| Carátulas     | API pública de Steam + [RAWG](https://rawg.io/apidocs) (clave opcional) |

### Funcionalidades

- **Colección personal** — alta, edición y borrado de juegos (estado, plataforma, nota, horas).
- **Búsqueda de carátulas** — combina Steam y RAWG (`RAWG_API_KEY` opcional pero recomendada). Las imágenes pasan por un proxy en el servidor para evitar bloqueos CORS.
- **Catálogo compartido** — `catalogo_juegos` enlaza cada ficha a un ID canónico para compartir portada entre usuarios.
- **Comunidad** — listado de miembros, perfiles públicos en solo lectura y medias globales por título (SQL `GROUP BY`).
- **Avatares** — 10 robots predefinidos (SVG); el usuario elige el suyo en **Perfil** (`/settings`); se guarda en `usuarios.avatar_id` y se muestra en barra superior, comunidad, perfiles y comentarios.
- **Hilos de comentarios** — comentarios anidados por juego (`/juego/:id/discussion`).
- **Panel de administración** — usuarios, borrado de cuentas y moderación de fichas. El rol se comprueba en base de datos en cada petición.
- **Roles** — visitante (pantalla de login), usuario registrado, administrador.
- **Carga con skeletons** — placeholders animados mientras llegan los datos.
- **Sesión centralizada** — `apiFetch()` unifica peticiones autenticadas y expiración del token.
- **Colección** — resumen (juegos, horas, completados), ordenación (reciente, título, estado, nota) y vista **cuadrícula** o **lista compacta**; estado vacío con mensaje propio.
- **Accesibilidad** — enlace “Saltar al contenido”, foco al `<main>`, etiquetas en controles de vista y ordenación.
- **Cuenta demo** — ver apartado siguiente.

### Arquitectura del servidor

```
server/
├── index.js
├── config/db.js
├── middleware/auth.middleware.js
├── utils/normalize.js, queries.js, covers.js
└── routes/auth, games, users, community, admin, covers.routes.js
```

### Estructura del repositorio

Orden típico **PERN**: frontend (`client/`), backend (`server/`), documentación (`docs/`), marca (`brand/`). **Empieza por** [`docs/README.md`](docs/README.md) para ver qué hay en `docs/`.

```
MyPlaythrough/
├── client/          # Frontend React + Vite (UI en español)
├── server/          # API Express + rutas por carpeta routes/
├── docs/            # SQL, plan de pruebas, diagrama BD — índice: docs/README.md
├── brand/           # Guía de marca: brand-book.html (exportar PNG)
├── docker-compose.yml
└── README.md        # Este archivo (español primero, inglés después)
```

### Puesta en marcha local

**Requisitos:** Node.js 18+ · PostgreSQL 14+ (o Docker Compose incluido)

**Opción A — Docker**

```bash
docker compose up --build
```

API en el puerto 3000 y PostgreSQL en 5432. El esquema se aplica desde `docs/schema.sql` la primera vez que el volumen está vacío.

**Opción B — Manual**

Backend: `cd server && npm install` — copia `server/.env.example` a `server/.env` y configura `DB_*`, `JWT_SECRET`, `CORS_ORIGIN`, opcionalmente `RAWG_API_KEY`. Ejecuta `npm run dev`.

Frontend: `cd client && npm install && npm run dev` (puerto 5173). Si la API no está en la URL por defecto, crea `client/.env` con `VITE_API_URL=...`.

Base de datos manual: ejecuta `docs/schema.sql` una vez. Si ya tenías una BD anterior, aplica también `docs/add-avatar-id-usuarios.sql`. Para promover admin, usa `docs/promover-admin.sql`.

**Datos de demostración (opcional):** desde `server/`, `npm run seed:demo` crea la cuenta demo y tres juegos si la cuenta aún no tiene fichas.

#### ¿Para qué sirve la cuenta demo?

- Que **quien evalúe el proyecto** (profesor, tribunal) pueda entrar **sin registrarse** y ver la app **con datos** (colección con varios juegos, estadísticas, vista lista/cuadrícula).
- Ahorrar tiempo en **defensa oral** o revisión: no hace falta crear usuario y añadir juegos a mano.
- **No sustituye** las pruebas con tu usuario real; es solo un atajo para demostración.

Tras `npm run seed:demo`: usuario `demo@myplaythrough.local` / contraseña `demo123456`. En la pantalla de login: **«Rellenar cuenta demo»**.

**Capturas para documentación:** puedes añadir imágenes en `docs/` (p. ej. `docs/screenshots/`) y enlazarlas desde la memoria del proyecto.

### Referencia rápida de la API

| Método              | Ruta                                 | Descripción                                | Auth |
| ------------------- | ------------------------------------ | ------------------------------------------ | ---- |
| GET                 | `/api/auth/me`                       | Usuario actual                             | ✓    |
| PATCH               | `/api/auth/me`                       | Actualizar `avatar_id` (robots permitidos) | ✓    |
| GET/POST/PUT/DELETE | `/api/games`…                        | CRUD de colección                          | ✓    |
| GET                 | `/api/users`, `/api/users/:id/games` | Comunidad                                  | ✓    |
| GET                 | `/api/community/stats`               | Medias globales                            | ✓    |
| …                   | …                                    | Comentarios, admin, proxy de imágenes      | …    |

(Listado completo en el código y en la documentación de entrega.)

### Seguridad (resumen)

Consultas parametrizadas, bcrypt, JWT, CORS restringido, cuerpo limitado a 50 kb, lista blanca en el proxy de imágenes, `/api/test-db` oculto en producción.

### Estado

Funcionalidades principales implementadas y probadas. Plan de pruebas: `docs/pruebas.md` y versión maquetada `docs/plan_pruebas.html`.

---

<a id="readme-en"></a>

## English

A web app for managing your personal video game collection. No ads, no noise, no features you don't need.

Platforms like HowLongToBeat or Backloggd are useful, but they tend to get cluttered. MyPlaythrough is a cleaner alternative: track your library, log what you're playing, what you've finished, and what's in your backlog — and optionally see what others in the community are playing.

> Final intermodular project — Higher Degree in Web Application Development (DAW) · CESUR Málaga Este · 2025/2026.

**Language:** The **UI** is **Spanish** (primary audience). This README lists **Spanish first**, then English. **Code identifiers** follow English naming (common in PERN stacks); **inline docs** in main server routes are in Spanish. See [`docs/README.md`](docs/README.md) for the documentation index.

### Tech stack

**PERN** — PostgreSQL · Express · React · Node.js

| Layer    | Technology                                     |
| -------- | ---------------------------------------------- |
| Frontend | React 18, Vite, Tailwind CSS, React Router DOM |
| Backend  | Node.js, Express 5                             |
| Database | PostgreSQL                                     |
| Auth     | JWT (`user` / `admin` roles)                   |
| Covers   | Steam public API + RAWG (optional key)         |

### Features

- **Personal collection** — add, edit, and delete games (status, platform, score, hours played).
- **Cover art search** — combines Steam and [RAWG](https://rawg.io/apidocs) (`RAWG_API_KEY` optional but recommended). Images are served through a server-side proxy to avoid CDN hotlink blocks in the browser.
- **Shared catalogue** — `catalogo_juegos` links each entry to a canonical RAWG/Steam ID so the same title shares artwork across users when picked from the search.
- **Community** — member list with preset robot avatars, read-only public profiles, and aggregated average scores per title (SQL `GROUP BY`).
- **Avatars** — 10 preset robots (SVG); pick yours under **Profile** (`/settings`); stored in `usuarios.avatar_id` and shown in the header, community, profiles, and comments.
- **Discussion threads** — threaded comments per game entry (`/juego/:id/discussion`).
- **Admin panel** — list users, delete accounts, and moderate any game entry. Role is verified against the database on every request.
- **Roles** — visitor (login wall), registered user, administrator.
- **Skeleton loading screens** — animated placeholders while data loads.
- **Centralised session handling** — `apiFetch()` wraps all authenticated requests; a single place handles token expiry across the whole frontend.
- **Collection UX** — summary stats (games, hours, completed), sorting (recent, title, status, score), grid or compact list view, custom empty state.
- **Accessibility** — skip link to main content, focus target on `<main>`, labels on sort/view controls.
- **Demo account** — see “Demo data” below.

### Server architecture

```
server/
├── index.js
├── config/db.js
├── middleware/auth.middleware.js
├── utils/normalize.js, queries.js, covers.js
└── routes/auth, games, users, community, admin, covers.routes.js
```

### Project structure

```
MyPlaythrough/
├── client/   # React + Vite SPA
├── server/   # Express REST API
├── docs/     # See docs/README.md — SQL, DB diagram, test plan
└── brand/    # Brand: `brand-book.html` (export PNG from browser)
```

### Local setup

**Prerequisites:** Node.js 18+ · PostgreSQL 14+ (or the included Docker Compose setup)

**Option A — Docker**

```bash
docker compose up --build
```

Starts the API on port 3000 and PostgreSQL on port 5432. The database schema is initialised automatically from `docs/schema.sql` the first time the volume is empty.

**Option B — Manual setup**

**Backend:** `cd server && npm install` — copy `server/.env.example` to `server/.env` and set `DB_*`, `JWT_SECRET`, `CORS_ORIGIN`, optionally `RAWG_API_KEY`. Run `npm run dev`.

**Frontend:** `cd client && npm install && npm run dev` (port 5173). If the API is not at the default address, create `client/.env`:

```env
VITE_API_URL=http://localhost:3000
```

**Database (manual):** run `docs/schema.sql` once. If you upgraded from an older schema, also run `docs/add-avatar-id-usuarios.sql`. To promote a user to `admin`, use `docs/promover-admin.sql` and update the email in that file.

**Demo data (optional):** from `server/`, run `npm run seed:demo` to create the demo user and three games if that account has no entries yet.

**Why the demo account?** So reviewers can log in **without signing up** and see the app **with sample data** (collection, stats, grid/list). Saves time in demos; it does **not** replace testing with your own account. Credentials: `demo@myplaythrough.local` / `demo123456`. Login: **“Rellenar cuenta demo”**.

**Screenshots for documentation:** add images under `docs/` (e.g. `docs/screenshots/`) and link them from your project report.

### API reference (summary)

| Method              | Route                                | Description                            | Auth |
| ------------------- | ------------------------------------ | -------------------------------------- | ---- |
| GET                 | `/api/auth/me`                       | Current user                           | ✓    |
| PATCH               | `/api/auth/me`                       | Update `avatar_id` (allowed robot ids) | ✓    |
| GET/POST/PUT/DELETE | `/api/games`…                        | Collection CRUD                        | ✓    |
| GET                 | `/api/users`, `/api/users/:id/games` | Community                              | ✓    |
| GET                 | `/api/community/stats`               | Global averages                        | ✓    |

(Full list in the codebase and delivery documentation.)

### Security overview

| Control                    | Implementation                                            |
| -------------------------- | --------------------------------------------------------- |
| SQL injection              | Parameterized queries (`pg` library) throughout           |
| Password storage           | bcrypt (cost factor 10)                                   |
| Authentication             | JWT — required on all private routes via `authMiddleware` |
| Authorization              | Role verified from DB on every admin request              |
| CORS                       | Restricted to `CORS_ORIGIN` env variable                  |
| JWT secret                 | Mandatory — server refuses to start without it            |
| Request body size          | Limited to 50 kb (`express.json({ limit: "50kb" })`)      |
| Image proxy host allowlist | Only known CDN domains accepted                           |
| Diagnostic endpoint        | `/api/test-db` returns 404 when `NODE_ENV=production`     |

### Status

Core features implemented and tested. Test plan: `docs/pruebas.md` and formatted `docs/plan_pruebas.html`.
