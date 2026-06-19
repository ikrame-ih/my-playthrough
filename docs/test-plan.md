# Test plan — MyPlaythrough

**Project:** MyPlaythrough  
**Author:** Ikrame Ibn Hayoun  
**Academic year:** 2025/2026

**Recommended view:** the full plan reads best in the browser at **`abrir-en-navegador/plan_pruebas.html`** (formatted tables, print / PDF export). This **`test-plan.md`** file is the Markdown source of the same content.

---

## 1. Purpose and scope

This document describes **what was tested**, **how**, and **with what result** in MyPlaythrough. It covers **manual** tests (UI and API with Thunder Client) and **automated unit** tests (Vitest). It does not replace a full functional code review.

---

## 2. Test types

| Type | Brief description |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Functional manual | User flows: registration, collection, community, extended social features, admin, comments. |
| Basic security | Protected routes without token, permissions, body limits, auth rate limiting, diagnostic endpoint in production. |
| Data validation | Input normalisation (email, title, status, platform) aligned with the backend. |
| Automated unit | Repeatable pure-logic tests (no browser or database), run with Vitest 3. |

---

## 3. Test environment

| Parameter | Value |
| ----------------- | ----------------------------------------- |
| Operating system | Windows 11 |
| Browser | Google Chrome 124 |
| Backend | Node.js 20, Express 5, port 3000 |
| Frontend | Vite, React 18, port 5173 |
| Database | PostgreSQL 16 (local or Docker) |
| API client | Thunder Client (VS Code extension) |

---

## 4. Automated unit tests (Vitest)

Run from each package folder in the terminal. Docker and PostgreSQL are **not** required for `normalize` and client utility tests.

| Location | Command | Scope |
| -------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend (`server/`) | `npm test` | `server/utils/normalize.js` (email, strong password, title, platform, status, catalogue reference, error payload per `NODE_ENV`). |
| Frontend (`client/`) | `npm test` | `gameLabels.js`, `coverUrl.js`, `passwordPolicy.js`. |

- Optional watch mode: `npm run test:watch` in `server` or `client`.
- **Tool:** Vitest 3 (Vite-compatible on the client, Node on the server).

**Link to manual validation:** cases V-01 to V-04 in section 7 align with logic tested in `normalize.js`.

---

## 5. Manual functional tests

Full case tables (58 manual tests) are in [`abrir-en-navegador/plan_pruebas.html`](abrir-en-navegador/plan_pruebas.html) — printable layout, all steps and results in English.

| Requirement area | ID range | Cases | Result |
| --- | --- | ---: | --- |
| RF-01 User management (auth) | P-01 … P-08c | 11 | All passed |
| RF-02 Library (CRUD) | P-09 … P-16 | 8 | All passed |
| RF-03 Entry details | P-17 … P-18 | 2 | All passed |
| RF-04 Community | P-19 … P-21 | 3 | All passed |
| RF-05 Statistics | P-22 … P-23 | 2 | All passed |
| RF-06 Administration | P-24 … P-27, P-44 | 5 | All passed |
| Game entry comments | P-28 … P-30 | 3 | All passed |
| RF-07 Extended social | P-31 … P-40 | 10 | All passed |
| RF-08 Preferences & UX | P-41 … P-43 | 3 | All passed |
| **Application flow (P-)** | | **46** | **46 / 46** |

---

## 6. Security tests (API / configuration)

See [`plan_pruebas.html`](abrir-en-navegador/plan_pruebas.html) sections 6–7 for step detail. Summary: **S-01 … S-08** — 8 cases, all passed (401/403/404/413/429, rate limiting, production diagnostics hidden).

---

## 7. Data validation (backend alignment)

**V-01 … V-04** — 4 cases, all passed (email normalisation, title trim, status mapping, default platform).

---

## 8. Summary

- **P-** prefix → **46** cases (P-01 … P-43 and **P-44**, plus variants **P-08b** and **P-08c** under RF-01).
- **S-01 … S-08** → **8** cases (API security / configuration).
- **V-01 … V-04** → **4** cases (data validation aligned with the backend).

**Total manual tests: 46 + 8 + 4 = 58.**

| Category | Total | Passed | Failed |
| --- | ---: | ---: | ---: |
| Application flow (**P-**) | 46 | 46 | 0 |
| API security / config (S-01 … S-08) | 8 | 8 | 0 |
| Data validation (V-01 … V-04) | 4 | 4 | 0 |
| **Total manual** | **58** | **58** | **0** |
| Automated unit (Vitest) | 27 | 27 | 0 |

The 27 unit tests are 17 in `server` and 10 in `client` (`npm test` in each folder).

---

## 9. Future improvements (not implemented)

1. **More uniform error messages:** route JSON shape varies slightly; centralise (e.g. middleware) and avoid long technical details in production responses.
2. **Real-time notifications:** the bell uses polling; WebSockets or SSE would be the next step for instant alerts.
3. **Merge duplicate entries:** a flow to combine two library rows and move comments/votes when they share `catalogo_id`.
4. **API integration tests:** a Supertest suite with a test API and database to catch cross-layer regressions.

