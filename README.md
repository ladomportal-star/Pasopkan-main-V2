# Pasopkan

An experience, ticketing, and tour-booking platform.

This repository holds **two independent projects** that are developed and
deployed separately:

| Path         | Project             | Stack                                                        |
| ------------ | ------------------- | ----------------------------------------------------------- |
| [`Backend/`](Backend/)  | `pasopkan-backend`  | Express, Drizzle ORM (PostgreSQL), Firebase Admin           |
| [`Frontend/`](Frontend/) | `pasopkan-frontend` | React 19, Vite, Tailwind CSS v4, Firebase (client SDK)      |

Each folder has its own `package.json`, `node_modules`, `tsconfig.json`,
`.env`, and lockfile. There is **no root `package.json`** — run `npm`
commands inside `Backend/` or `Frontend/`.

---

## Prerequisites

- **Node.js** `v20 LTS` or higher
- **npm** `v9+`
- **PostgreSQL** (optional — the backend falls back to in-memory stores)

---

## Quick start (local development)

Open **two terminals**.

### 1. Backend (API — http://localhost:3000)

```bash
cd Backend
npm install
cp .env.example .env      # optional: fill in SQL_* / Firebase values
npm run dev
```

### 2. Frontend (web app — http://localhost:5173)

```bash
cd Frontend
npm install
npm run dev
```

The frontend needs **no `.env` file** — it runs on built-in defaults.
The Vite dev server proxies `/api/*` to the backend
(`VITE_API_PROXY_TARGET`, default `http://localhost:3000`), so the app
works from a single origin during development. To override any default,
create `Frontend/.env` (see the header of `Frontend/vite.config.ts`).

> Prefer one command? From the repo root:
> `npx concurrently -n api,web "npm --prefix Backend run dev" "npm --prefix Frontend run dev"`

---

## Scripts

### Backend (`cd Backend`)

| Command             | Description                                              |
| ------------------- | ------------------------------------------------------- |
| `npm run dev`       | Start the API with auto-reload (`tsx watch`)            |
| `npm run build`     | Bundle to `Backend/dist/server.cjs` (esbuild)           |
| `npm run start`     | Run the built server (`NODE_ENV=production`)            |
| `npm run lint`      | Type-check (`tsc --noEmit`)                             |
| `npm run db:push`   | Push the Drizzle schema to PostgreSQL                   |
| `npm run db:studio` | Open Drizzle Studio                                     |

### Frontend (`cd Frontend`)

| Command           | Description                                  |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | Vite dev server on port 5173                 |
| `npm run build`   | Production build to `Frontend/dist`          |
| `npm run preview` | Preview the production build                 |
| `npm run lint`    | Type-check (`tsc --noEmit`)                  |

---

## Environment variables

**Backend** — see `Backend/.env.example` for the full, commented list.

- `PORT` – API port (default `3000`)
- `CORS_ORIGIN` – comma-separated allowed browser origins (empty = any)
- `SQL_HOST` / `SQL_PORT` / `SQL_DB_NAME` / `SQL_USER` / `SQL_PASSWORD` –
  PostgreSQL connection (omit to run in in-memory fallback mode)
- `FIREBASE_PROJECT_ID` – Firebase project for ID-token verification
- `GOOGLE_APPLICATION_CREDENTIALS` – path to a service-account key JSON.
  **Required for real token verification**; without it the API trusts the
  client-supplied UID (development only).
- `FRONTEND_DIST` – optional path to `Frontend/dist` to serve the SPA from
  the API process (single-process deploy).

**Frontend** — no `.env` required; all optional. Create `Frontend/.env`
only to override a default (documented in `Frontend/vite.config.ts`).

- `VITE_API_PROXY_TARGET` – backend origin for the dev proxy (default `http://localhost:3000`)
- `GEMINI_API_KEY` – optional, inlined at build time
- `DISABLE_HMR` – set to `true` to turn off Hot Module Replacement

---

## Database — Supabase / PostgreSQL (optional)

Drizzle ORM + PostgreSQL. Without a database the ticket / review endpoints
run on in-memory fallback stores.

```bash
cd Backend
# 1. put your connection string in .env
#    DATABASE_URL=postgresql://…pooler.supabase.com:5432/postgres?sslmode=require
#    (or the discrete SQL_* vars for a local Postgres)
# 2. apply the schema
npm run db:migrate      # versioned migrations in Backend/drizzle/
# or: npm run db:push    # push schema directly (prototyping)
```

Full guide, connection-string choices and the schema (ERD + table
reference): **[`Backend/DATABASE.md`](Backend/DATABASE.md)**.

---

## Firebase

- `Frontend/firebase-applet-config.json` holds the **client** Firebase
  config (public web keys — safe to commit).
- The backend only needs `FIREBASE_PROJECT_ID` (+ a service account for
  production).
- Firestore security rules live in [`firestore.rules`](firestore.rules)
  and are deployed via the Firebase console / CLI.

---

## Production deployment

**Separate (recommended):**

1. `cd Frontend && npm run build` → deploy `Frontend/dist` to any static
   host / CDN.
2. `cd Backend && npm run build && npm run start` → deploy the API. Set
   `CORS_ORIGIN` to the frontend's URL.

**Single process:**

1. `cd Frontend && npm run build`
2. `cd Backend && npm run build`
3. `cd Backend && FRONTEND_DIST=../Frontend/dist npm run start` — the API
   serves the SPA and its own `/api` routes on one port.
