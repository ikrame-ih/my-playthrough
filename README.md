# MyPlaythrough

<p align="center">
  <a href="#readme-es"><img src="https://img.shields.io/badge/README-Espa%C3%B1ol-115e59?style=for-the-badge&labelColor=0f172a" alt="Español" /></a>
  &nbsp;
  <a href="#readme-en"><img src="https://img.shields.io/badge/README-English-475569?style=for-the-badge&labelColor=0f172a" alt="English" /></a>
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

### Idioma y convención

- **Diseño de interfaz** — [`DESIGN_ES.md`](DESIGN_ES.md) (español) y [`DESIGN.md`](DESIGN.md) (inglés): decisiones visuales, componentes y flujos de pantalla.
- **Interfaz de la aplicación** — textos y mensajes al usuario en **español**.
- **Este README** — sección en **español** primero; después, resumen en **inglés** para quien prefiera leer en ese idioma.
- **Código** — carpetas, archivos, variables y rutas API en **inglés** (convención habitual en stacks PERN). En el backend, los bloques JSDoc principales están en **español**.
- **Registro** — contraseña de **al menos 8 caracteres** con **mayúscula, minúscula, número y símbolo** (validación en servidor y aviso en el formulario). El **nombre de usuario** público es **único** (sin distinguir mayúsculas; índice en BD).
- **Inicio de sesión** — **correo** o **nombre de usuario** (el que aparece en comunidad).
- **Documentación en `docs/`** — índice en [`docs/README.md`](docs/README.md): scripts SQL en `docs/sql/`, documentación HTML en `docs/abrir-en-navegador/`, plan de pruebas en Markdown; redactado en **español** salvo nombres técnicos de ficheros.
- **Modelo de datos** — el esquema canónico está en [`docs/sql/schema.sql`](docs/sql/schema.sql): **ocho tablas** (`usuarios`, `catalogo_juegos`, `juegos`, `juego_comentarios`, `juego_comentario_votos`, `usuario_seguimientos`, `juego_recomendaciones`, `lfg_publicaciones`). Diagrama interactivo: [`docs/abrir-en-navegador/diagrama_bd.html`](docs/abrir-en-navegador/diagrama_bd.html).

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
- **Comunidad** — miembros (seguir desde tarjeta o perfil), estadísticas globales, **actividad** de quien sigues (comentarios y LFG) y **buscar grupo (LFG)** con modos online / co-op local / otro.
- **Recomendaciones** — enviar un juego de tu biblioteca solo a usuarios a los que sigues; bandeja en `/recommendations`, campana con contador y **tono opcional** al recibir nuevas (activar o silenciar en **Perfil**; el navegador puede exigir un clic previo en la página para reproducir audio).
- **Avatares** — 10 robots predefinidos (SVG); el usuario elige el suyo en **Perfil** (`/settings`); se guarda en `usuarios.avatar_id` y se muestra en barra superior, comunidad, perfiles y comentarios.
- **Hilos de comentarios** — comentarios anidados por juego (`/juego/:id/discussion`).
- **Panel de administración** — listado de usuarios, de todas las fichas y de publicaciones **LFG** (buscar grupo), con borrado donde la API lo permite; borrado de cuentas (en cascada: juegos y comentarios de ese usuario) y borrado de cualquier ficha. En la **discusión** de un juego, un **admin** puede borrar un comentario ajeno (misma regla que autor o dueño de la ficha). El rol se comprueba en base de datos en cada petición.
- **Roles** — visitante (pantalla de login), usuario registrado, administrador.
- **Carga con skeletons** — placeholders animados mientras llegan los datos.
- **Sesión centralizada** — `apiFetch()` unifica peticiones autenticadas y expiración del token.
- **Colección** — resumen (juegos, horas, completados), ordenación (reciente, título, estado, nota) y vista **cuadrícula** o **lista compacta**; estado vacío con mensaje propio.
- **Accesibilidad** — enlace “Saltar al contenido”, foco al `<main>`, etiquetas en controles de vista y ordenación.
- **Cuenta demo** — ver apartado siguiente.
- **Tour guiado** — se ofrece la **primera vez en ese navegador** tras iniciar sesión (se guarda preferencia en `localStorage`; no depende del alta en servidor). La **cuenta demo** en un perfil limpio también lo verá, para facilitar la demostración. Se puede **volver a lanzar** desde **Perfil**.

### Arquitectura del servidor

```
server/
├── index.js
├── config/db.js
├── middleware/auth.middleware.js
├── utils/normalize.js, queries.js, covers.js
└── routes/auth, games, users, community, social, admin, covers.routes.js
```

### Estructura del repositorio

Orden típico **PERN**: frontend (`client/`), backend (`server/`), documentación (`docs/`), marca (`brand/`). El índice de `docs/` está en [`docs/README.md`](docs/README.md).

```
MyPlaythrough/
├── client/          # Frontend React + Vite (UI en español)
├── server/          # API Express + rutas por carpeta routes/
├── docs/            # docs/README.md — sql/, abrir-en-navegador/, pruebas.md
├── brand/           # Guía de marca: brand-book.html (exportar PNG)
├── docker-compose.yml
└── README.md        # Este archivo (español e inglés)
```

### Puesta en marcha local

**Requisitos:** Node.js 18+ y PostgreSQL 14+, o Docker.

#### Opción A — Docker (API + base de datos)

```bash
docker compose up --build
```

- API en el puerto **3000**, PostgreSQL en **5432**.
- Con volumen de datos vacío, el esquema se crea desde `docs/sql/schema.sql`.

#### Opción B — Manual (cuatro pasos)

1. **Base de datos** — Crea una base en PostgreSQL y ejecuta **`docs/sql/schema.sql`** una vez.
2. **Migraciones** (solo si vienes de una versión antigua del proyecto): aplica lo que falte, en este orden habitual — `docs/sql/add-avatar-id-usuarios.sql` si no existe `avatar_id`; en la carpeta `server/`, **`npm run migrate:social`**, **`npm run migrate:votes`** y **`npm run migrate:username-unique`** (equivalentes a los SQL de `docs/sql/add-social-features.sql`, `add-comentario-votos.sql`, `add-usuario-nombre-unique.sql`). Para dar rol admin a un correo concreto, edita y ejecuta `docs/sql/promover-admin.sql`.
3. **Backend** — `cd server`, `npm install`, copia `server/.env.example` a `server/.env` y configura `DB_*`, `JWT_SECRET`, `CORS_ORIGIN` y, si quieres más resultados en el buscador de carátulas, `RAWG_API_KEY`. Arranque: `npm run dev`.
4. **Frontend** — `cd client`, `npm install`, `npm run dev` (puerto **5173**). Si la API no está en `http://localhost:3000`, crea `client/.env` con `VITE_API_URL=http://…`.

**Si el login falla tras actualizar el repositorio:** casi siempre falta una migración (columna `notificaciones_sonido`, tablas sociales, votos en comentarios o índice de nombre único). Ejecuta los comandos `migrate:*` anteriores y reinicia el servidor.

**Datos de demostración (opcional, siempre desde `server/`):**

- **`npm run seed:demo`** — Cuenta **demo** con tres juegos y carátulas reales (Steam/RAWG), solo si esa cuenta aún no tiene fichas.
- **`npm run seed:presentation`** — Población completa de ejemplo: **Tizza**, **Rufleto** y **Demo Jurado** como **administradores**; **ElOtro**, **Knekro**, **SequianCalvísimo** y **LaQueTeCuento>:(** como usuarios normales; juegos, comentarios, seguimientos y recomendaciones. Todas las filas de `usuarios` quedan con la **misma contraseña** y los roles de admin según esa tabla.

**Contraseña** tras `seed:presentation` (y la que aplica el script a los usuarios del seed): **`Presentacion2026!`**

En el login, **«Rellenar cuenta demo»** usa **Demo Jurado** y esa contraseña (`demo@myplaythrough.local`).

**Cuentas del seed** (misma contraseña si ejecutaste `seed:presentation`; entra con **email** o **nombre público**). Administración: Tizza, Rufleto y Demo Jurado.

| Nombre público   | Email                       | Rol tras seed |
| ---------------- | --------------------------- | ------------- |
| Tizza            | tizza@myplaythrough.local   | admin         |
| Rufleto          | rufleto@myplaythrough.local | admin         |
| Demo Jurado      | demo@myplaythrough.local    | admin         |
| ElOtro           | elotro@myplaythrough.local  | usuario       |
| Knekro           | knekro@myplaythrough.local  | usuario       |
| SequianCalvísimo | sequian@myplaythrough.local | usuario       |
| LaQueTeCuento>:( | laquete@myplaythrough.local | usuario       |

#### Cuenta demo en la pantalla de login

Permite entrar **sin registrarse** y ver la aplicación **con datos de ejemplo** (colección, estadísticas, vistas lista y cuadrícula). Sirve para demostración rápida; conviene probar también con un usuario registrado a mano.

### Referencia rápida de la API

| Método              | Ruta                                                   | Descripción                             | Auth  |
| ------------------- | ------------------------------------------------------ | --------------------------------------- | ----- |
| GET                 | `/api/auth/me`                                         | Usuario actual                          | ✓     |
| PATCH               | `/api/auth/me`                                         | `avatar_id` y/o `notificaciones_sonido` | ✓     |
| GET/POST/PUT/DELETE | `/api/games`…                                          | CRUD de colección                       | ✓     |
| GET                 | `/api/users`, `/api/users/:id/games`                   | Comunidad (lista incluye `siguiendo`)   | ✓     |
| GET                 | `/api/community/stats`                                 | Medias globales                         | ✓     |
| GET/POST/DELETE     | `/api/social/follow/…`, `following`, `follow-status/…` | Seguimientos                            | ✓     |
| GET/POST/PATCH      | `/api/social/recommendations…`                         | Recomendaciones y no leídas             | ✓     |
| GET/POST/DELETE     | `/api/social/lfg…`                                     | Buscar grupo (LFG)                      | ✓     |
| GET                 | `/api/social/activity`                                 | Actividad de seguidos                   | ✓     |
| GET                 | `/api/admin/lfg`                                       | Listado LFG (moderación)                | admin |
| …                   | …                                                      | Comentarios, más rutas admin, proxy     | …     |

(Listado completo en el código fuente de `server/routes/`.)

### Seguridad (resumen)

- **SQL** — Consultas **parametrizadas** (`pg`): los valores del usuario no se interpolan en el texto SQL, lo que evita **inyección SQL**.
- **Contraseñas** — Hash con algoritmo **bcrypt** (coste 10) mediante la biblioteca **`bcryptjs`** en Node.js; nunca en claro.
- **API** — **JWT** firmado con un secreto del servidor; rutas privadas exigen token válido.
- **Permisos** — En administración, el **rol** se comprueba en **base de datos** en cada petición, no solo en el cliente.
- **CORS** — Solo el origen configurado en `CORS_ORIGIN` puede usar la API desde el navegador.
- **Peticiones** — Tamaño máximo del cuerpo JSON: **50 kb**.
- **Proxy de carátulas** — Solo se reenvían URLs de dominios permitidos (Steam, RAWG, etc.).
- **Producción** — Con `NODE_ENV=production`, el endpoint de prueba `/api/test-db` responde **404** (no se expone al público).
- **Login y registro** — Límite de frecuencia por IP (`express-rate-limit`): demasiados `POST` a `/api/auth/login` o `/api/auth/register` en una ventana de tiempo → **429 Too Many Requests** con JSON de error coherente.

### Bibliografía (consulta y temario DAW)

Referencias generales alineadas con el ciclo y con el stack del proyecto (lectura complementaria, no lista cerrada):

- [MDN Web Docs](https://developer.mozilla.org/es/) — HTML, CSS, JavaScript, HTTP y APIs del navegador.
- [Express](https://expressjs.com/) — guía de rutas, middleware y aplicaciones HTTP en Node.js.
- [Documentación de PostgreSQL](https://www.postgresql.org/docs/) — SQL, tipos, integridad referencial.
- [React](https://react.dev/) — interfaz declarativa, hooks y referencia de la API.
- [RFC 7519 — JSON Web Token (JWT)](https://www.rfc-editor.org/rfc/rfc7519) — estructura y claims del token.
- [Node.js — documentación](https://nodejs.org/docs/) — runtime, módulos `http`/`fs` y buenas prácticas.

### Estado

Funcionalidades principales implementadas y probadas. Plan de pruebas: `docs/pruebas.md`; para revisión con tablas e impresión/PDF, conviene abrir `docs/abrir-en-navegador/plan_pruebas.html` en el navegador.

---

<a id="readme-en"></a>

## English

A web app for managing your personal video game collection. No ads, no noise, no features you don't need.

Platforms like HowLongToBeat or Backloggd are useful, but they tend to get cluttered. MyPlaythrough is a cleaner alternative: track your library, log what you're playing, what you've finished, and what's in your backlog — and optionally see what others in the community are playing.

> Final intermodular project — Higher Degree in Web Application Development (DAW) · CESUR Málaga Este · 2025/2026.

**Language & layout:** [`DESIGN_ES.md`](DESIGN_ES.md) (Spanish) and [`DESIGN.md`](DESIGN.md) (English) describe the UI. The **app strings** are **Spanish**. This README is **Spanish first**, then **English**. **Code identifiers** use English naming (typical for PERN). Main server JSDoc blocks are in Spanish. Documentation index: [`docs/README.md`](docs/README.md).

**Database schema:** [`docs/sql/schema.sql`](docs/sql/schema.sql) defines **eight tables** (`usuarios`, `catalogo_juegos`, `juegos`, `juego_comentarios`, `juego_comentario_votos`, `usuario_seguimientos`, `juego_recomendaciones`, `lfg_publicaciones`). Interactive diagram: [`docs/abrir-en-navegador/diagrama_bd.html`](docs/abrir-en-navegador/diagrama_bd.html).

**Registration:** passwords must be **at least 8 characters** with **uppercase, lowercase, a digit, and a symbol** (server-side + form hint). **Display names** (`nombre_usuario`) are **unique** (case-insensitive; DB index).

**Login:** **email** or **username** (same public name as in the community).

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
- **Community** — member list with follow actions, read-only public profiles, global averages (SQL `GROUP BY`), **activity feed** from people you follow (comments + LFG posts), and **LFG** (“looking for group”) posts tied to your library (online / local co-op / other).
- **Recommendations** — send a game from your library only to users you follow; inbox at `/recommendations`, header bell with unread count, optional **chime** for new items (toggle in **Profile**; browsers may require a click on the page before playing sound).
- **Avatars** — 10 preset robots (SVG); pick yours under **Profile** (`/settings`); stored in `usuarios.avatar_id` and shown in the header, community, profiles, and comments.
- **Discussion threads** — threaded comments per game entry (`/juego/:id/discussion`).
- **Admin panel** — list users, all game rows, and **LFG** posts; delete accounts (cascades games and comments), delete any game, delete LFG (same rule as in Community). On a game’s **discussion** page, **admins** may delete someone else’s comment. Role is checked in the database on every request.
- **Roles** — visitor (login wall), registered user, administrator.
- **Skeleton loading screens** — animated placeholders while data loads.
- **Centralised session handling** — `apiFetch()` wraps all authenticated requests; a single place handles token expiry across the whole frontend.
- **Collection UX** — summary stats (games, hours, completed), sorting (recent, title, status, score), grid or compact list view, custom empty state.
- **Accessibility** — skip link to main content, focus target on `<main>`, labels on sort/view controls.
- **Demo account** — see “Demo data” below.
- **Welcome tour** — shown the **first time in that browser** after login (`localStorage` flag; not tied to server-side “new user”). The **demo** account on a clean browser profile will see it too, which helps demos. **Restart from Profile** anytime.

### Server architecture

```
server/
├── index.js
├── config/db.js
├── middleware/auth.middleware.js
├── utils/normalize.js, queries.js, covers.js
└── routes/auth, games, users, community, social, admin, covers.routes.js
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

**Prerequisites:** Node.js 18+ and PostgreSQL 14+, or Docker.

#### Option A — Docker (API + database)

```bash
docker compose up --build
```

API on port **3000**, PostgreSQL on **5432**. Empty volume → schema from `docs/sql/schema.sql`.

#### Option B — Manual (four steps)

1. **Database** — Create a database and run **`docs/sql/schema.sql`** once.
2. **Migrations** (only if upgrading an old checkout): apply what you still need, in order — `docs/sql/add-avatar-id-usuarios.sql` if `avatar_id` is missing; in **`server/`**, `npm run migrate:social`, `npm run migrate:votes`, `npm run migrate:username-unique` (same as the SQL files under `docs/sql/`). Edit and run `docs/sql/promover-admin.sql` to grant `admin` to a specific email.
3. **Backend** — `cd server`, `npm install`, copy `.env.example` to `.env`, set `DB_*`, `JWT_SECRET`, `CORS_ORIGIN`, optional `RAWG_API_KEY`. Run `npm run dev`.
4. **Frontend** — `cd client`, `npm install`, `npm run dev` (port **5173**). If the API is not at `http://localhost:3000`, add `client/.env` with `VITE_API_URL=...`.

**Login fails after `git pull`:** run the `migrate:*` commands above; the DB is usually missing social tables, sound column, comment votes, or the username index.

**Optional demo data (from `server/`):**

- `npm run seed:demo` — Demo account with three games and real covers, only if it has no games yet.
- `npm run seed:presentation` — Full sample dataset: **Tizza**, **Rufleto**, **Demo Jurado** as **admins**; **ElOtro**, **Knekro**, **SequianCalvísimo**, **LaQueTeCuento>:(** as normal users; games, comments, follows, recommendations. **One password** for every `usuarios` row created/updated by the script.

**Password after `seed:presentation`:** **`Presentacion2026!`**. The login shortcut **“Rellenar cuenta demo”** uses **Demo Jurado** / `demo@myplaythrough.local`.

**Screenshots** for reports can live under `docs/` (e.g. `docs/screenshots/`).

### API reference (summary)

| Method              | Route                                | Description                                | Auth  |
| ------------------- | ------------------------------------ | ------------------------------------------ | ----- |
| GET                 | `/api/auth/me`                       | Current user                               | ✓     |
| PATCH               | `/api/auth/me`                       | `avatar_id` and/or `notificaciones_sonido` | ✓     |
| GET/POST/PUT/DELETE | `/api/games`…                        | Collection CRUD                            | ✓     |
| GET                 | `/api/users`, `/api/users/:id/games` | Community (list includes `siguiendo`)      | ✓     |
| GET                 | `/api/community/stats`               | Global averages                            | ✓     |
| various             | `/api/social/…`                      | Follows, recommendations, LFG, activity    | ✓     |
| GET                 | `/api/admin/lfg`                     | LFG list (moderation)                      | admin |

(Full list in `server/routes/` source files.)

### Security overview

- **SQL injection** — **Parameterized queries** everywhere: user input is never concatenated into SQL strings.
- **Passwords** — **bcrypt**-compatible hashes (cost 10) via the **`bcryptjs`** package; plaintext is never stored.
- **Auth** — **JWT** signed with `JWT_SECRET`; private routes use `authMiddleware`.
- **Authorization** — **Admin role** is read from the **database** on each admin request.
- **CORS** — Allowed browser origin comes from **`CORS_ORIGIN`**.
- **Request size** — JSON body limited to **50 kb**.
- **Image proxy** — Only approved CDN hostnames are fetched.
- **Production** — `/api/test-db` returns **404** when `NODE_ENV=production`.
- **Login / register** — Per-IP rate limiting (`express-rate-limit`): too many `POST` requests to `/api/auth/login` or `/api/auth/register` within the window → **429 Too Many Requests** with a consistent JSON error body.

### Bibliography (DAW curriculum & stack)

General references aligned with the degree syllabus and this project’s stack (illustrative, not exhaustive):

- [MDN Web Docs](https://developer.mozilla.org/en-US/) — HTML, CSS, JavaScript, HTTP, and Web APIs.
- [Express](https://expressjs.com/) — routing, middleware, and HTTP apps on Node.js.
- [PostgreSQL Documentation](https://www.postgresql.org/docs/) — SQL, types, and referential integrity.
- [React](https://react.dev/) — declarative UI, hooks, and API reference.
- [RFC 7519 — JSON Web Token (JWT)](https://www.rfc-editor.org/rfc/rfc7519) — token structure and claims.
- [Node.js documentation](https://nodejs.org/docs/) — runtime, modules, and APIs.

### Status

Core features implemented and tested. Test plan: `docs/pruebas.md`; for tables and print/PDF export, open `docs/abrir-en-navegador/plan_pruebas.html` in a browser.
