# Production deployment

MyPlaythrough runs as a split deployment: **React on Vercel** + **Express + PostgreSQL on Render**.

| Layer | Platform | URL |
| --- | --- | --- |
| **Live demo** | Vercel | [my-playthrough.vercel.app](https://my-playthrough.vercel.app) |
| **REST API** | Render Web Service | [myplaythrough-api.onrender.com](https://myplaythrough-api.onrender.com) |
| **Database** | Render PostgreSQL | Managed by `render.yaml` |

## One-time setup

### 1. Backend (Render)

1. Connect the GitHub repo on [Render](https://render.com) and apply the root **`render.yaml`** Blueprint.
2. Set environment variables when prompted:
   - `CORS_ORIGIN` → `https://my-playthrough.vercel.app`
   - `RAWG_API_KEY` → optional; improves cover search beyond Steam
3. After the database is live, run **`docs/sql/schema.sql`** once (pgAdmin, DBeaver, or `psql` with the External Database URL).
4. Check health: `GET /api/health` → `{"ok":true}`

### 2. Frontend (Vercel)

1. Import the repo on [Vercel](https://vercel.com/new).
2. **Root Directory:** `client`
3. **Framework:** Vite — Build `npm run build`, Output `dist`
4. Environment variable:

   | Name | Value |
   | --- | --- |
   | `VITE_API_URL` | `https://myplaythrough-api.onrender.com` |

5. Deploy production. Redeploy after any change to `VITE_*` variables.

### 3. Demo / portfolio data (optional)

From `server/` with `DATABASE_URL` pointing at Render Postgres (or local dev DB):

```bash
npm run seed:demo           # demo@myplaythrough.local + 3 games
npm run seed:presentation   # users, comments, follows, recommendations, LFG
```

Password for seeded accounts: **`Presentacion2026!`**

## Notes

- Render free tier sleeps the API after inactivity; the first request may take ~30–60 s.
- Never commit `.env` files or database credentials.
- `render.yaml` at the repo root defines the API service and Postgres instance for Render Blueprint sync.
