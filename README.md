# Pasopkan

An experience, ticketing, and tour-booking platform.

This repository holds **two independent projects** that are developed and
deployed separately:

| Path         | Project             | Stack                                                        |
| ------------ | ------------------- | ----------------------------------------------------------- |
| [`backend/`](backend/)  | `pasopkan-backend`  | Express, Drizzle ORM (PostgreSQL), Supabase Auth (JWT)     |
| [`frontend/`](frontend/) | `pasopkan-frontend` | React 19, Vite, Tailwind CSS v4, Supabase (client SDK)      |

Each folder has its own `package.json`, `node_modules`, `tsconfig.json`,
`.env`, and lockfile. There is **no root `package.json`** — run `npm`
commands inside `backend/` or `frontend/`.

---

## Prerequisites

- **Node.js** `v20 LTS` or higher
- **npm** `v9+`
- **PostgreSQL** (optional — the backend falls back to in-memory stores)

---

## Quick start (local development)

```bash
cd backend  && npm install && cp .env.example .env    # fill in DATABASE_URL, SUPABASE_URL, ...
npm run dev                                            # API on http://localhost:3000

# in a second terminal
cd frontend && npm install
npm run dev               # web app on http://localhost:5173
```

Backend and frontend run as two separate processes on two separate ports.
The Vite dev server proxies `/api/*` requests to `http://localhost:3000`
(see `frontend/vite.config.ts`), so `fetch('/api/...')` needs no CORS setup.
Client env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) go in
`frontend/.env` (copy `frontend/.env.example`); server settings go in `backend/.env`.

---

## Scripts

### backend (`cd backend`)

| Command             | Description                                              |
| ------------------- | ------------------------------------------------------- |
| `npm run dev`       | Start the API with auto-reload (`tsx watch`)            |
| `npm run build`     | Bundle to `backend/dist/server.cjs` (esbuild)           |
| `npm run start`     | Run the built server (`NODE_ENV=production`)            |
| `npm run lint`      | Type-check (`tsc --noEmit`)                             |
| `npm run db:push`   | Push the Drizzle schema to PostgreSQL                   |
| `npm run db:studio` | Open Drizzle Studio                                     |

### frontend (`cd frontend`)

| Command           | Description                                  |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | Vite dev server on port 5173 (proxies `/api/*` to `:3000`) |
| `npm run build`   | Production build to `frontend/dist`          |
| `npm run preview` | Preview the production build                 |
| `npm run lint`    | Type-check (`tsc --noEmit`)                  |

---

## Environment variables

**backend** — see `backend/.env.example` for the full, commented list.

- `PORT` – API port (default `3000`)
- `CORS_ORIGIN` – comma-separated allowed browser origins (empty = any)
- `SQL_HOST` / `SQL_PORT` / `SQL_DB_NAME` / `SQL_USER` / `SQL_PASSWORD` –
  PostgreSQL connection (omit to run in in-memory fallback mode)
- `FIREBASE_PROJECT_ID` – Firebase project for ID-token verification
- `GOOGLE_APPLICATION_CREDENTIALS` – path to a service-account key JSON.
  **Required for real token verification**; without it the API trusts the
  client-supplied UID (development only).
- `FRONTEND_DIST` – optional path to `frontend/dist` to serve the SPA from
  the API process (single-process deploy).

**frontend** — no `.env` required; all optional. Create `frontend/.env`
only to override a default (documented in `frontend/vite.config.ts`).

- `VITE_API_PROXY_TARGET` – backend origin for the dev proxy (default `http://localhost:3000`)
- `GEMINI_API_KEY` – optional, inlined at build time
- `DISABLE_HMR` – set to `true` to turn off Hot Module Replacement

---

## Database — Supabase / PostgreSQL (optional)

Drizzle ORM + PostgreSQL. Without a database the ticket / review endpoints
run on in-memory fallback stores.

```bash
cd backend
# 1. put your connection string in .env
#    DATABASE_URL=postgresql://…pooler.supabase.com:5432/postgres?sslmode=require
#    (or the discrete SQL_* vars for a local Postgres)
# 2. apply the schema
npm run db:migrate      # versioned migrations in backend/drizzle/
# or: npm run db:push    # push schema directly (prototyping)
```

Full guide, connection-string choices and the schema (ERD + table
reference): **[`backend/DATABASE.md`](backend/DATABASE.md)**.

---

## Firebase

- `frontend/src/config/firebase-applet-config.json` holds the **client**
  Firebase config (public web keys — safe to commit).
- The backend only needs `FIREBASE_PROJECT_ID` (+ a service account for
  production).
- Firestore security rules live in [`firestore.rules`](firestore.rules)
  and are deployed via the Firebase console / CLI.

---

## Production deployment

**Separate (recommended):**

1. `cd frontend && npm run build` → deploy `frontend/dist` to any static
   host / CDN.
2. `cd backend && npm run build && npm run start` → deploy the API. Set
   `CORS_ORIGIN` to the frontend's URL.

**Single process:**

1. `cd frontend && npm run build`
2. `cd backend && npm run build`
3. `cd backend && FRONTEND_DIST=../frontend/dist npm run start` — the API
   serves the SPA and its own `/api` routes on one port.
