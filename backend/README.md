# Pasopkan backend

Express + TypeScript API. Talks to PostgreSQL (Supabase) through Drizzle
ORM and verifies Firebase ID tokens. Runs standalone on port `3000`; the
frontend project calls it over HTTP.

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL, FIREBASE_PROJECT_ID, …
npm run dev               # tsx watch, http://localhost:3000
```

## Scripts

| Command               | Description                                        |
| --------------------- | -------------------------------------------------- |
| `npm run dev`         | Start with auto-reload (`tsx watch src/server.ts`) |
| `npm run build`       | Bundle to `dist/server.cjs` (esbuild)              |
| `npm run start`       | Run the built server (`NODE_ENV=production`)       |
| `npm run typecheck`   | `tsc --noEmit`                                     |
| `npm run lint`        | ESLint (`lint:fix` to autofix)                     |
| `npm run format`      | Prettier write (`format:check` to verify)          |
| `npm run test`        | Vitest suite (`test:watch` for watch mode)         |
| `npm run check`       | typecheck + lint + test                            |
| `npm run db:generate` | Generate a new SQL migration from the schema       |
| `npm run db:migrate`  | Apply migrations in `drizzle/`                     |
| `npm run db:push`     | Push the schema straight to the DB (prototyping)   |
| `npm run db:studio`   | Open Drizzle Studio                                |

## Layout

```
src/
├── config/       env.ts (zod-validated env)  ·  database.ts (pg Pool + Drizzle)
├── controllers/  thin request handlers, one per resource
├── routes/       path → controller wiring, mounted in routes/index.ts
├── services/     business logic + in-memory fallbacks
├── models/       Drizzle schema (schema.ts) + barrel (index.ts)
├── middlewares/  auth · validate (zod) · error (404 + handler)
├── validators/   zod request schemas, one per resource
├── types/        express.d.ts (augments Request with `user`)
├── utils/        logger.ts (pino)  ·  response.util.ts
├── app.ts        builds the Express app (helmet, cors, compression, rate-limit, pino-http)
└── server.ts     entry point — listen, graceful shutdown

tests/            Vitest + supertest integration tests
drizzle/          committed SQL migrations
```

Request flow: `route → (requireAuth) → (validate) → controller → service → models/db`.

## Endpoints

| Method & path                    | Auth | Purpose                                                              |
| -------------------------------- | ---- | -------------------------------------------------------------------- |
| `GET  /api/health`               | –    | liveness                                                             |
| `GET  /api/resolve-map-url`      | –    | resolve a Google Maps short link                                     |
| `POST /api/account/sync`         | ✔    | upsert the caller's profile (email + name/phone/avatar)              |
| `GET  /api/events`               | –    | list catalog (`?status=&organizerUid=&limit=`)                       |
| `GET  /api/events/:id`           | –    | one event by uuid / slug / legacy id, with tiers·zones·dates·coupons |
| `POST /api/events`               | ✔    | create an event + nested tiers/zones/dates/coupons (one tx)          |
| `PUT  /api/events/:id`           | ✔    | update columns; a sent child array replaces that set                 |
| `GET  /api/tickets`              | ✔    | the caller's orders + items                                          |
| `POST /api/tickets`              | ✔    | create an order + one ticket per quantity                            |
| `POST /api/checkins`             | ✔    | scan a `ticketCode` (idempotent)                                     |
| `GET  /api/checkins?eventId=`    | ✔    | check-ins for an event                                               |
| `GET  /api/reviews/:eventId`     | –    | reviews for an event                                                 |
| `POST /api/reviews`              | ✔    | create/update the caller's review                                    |
| `POST /api/webhook/payment`      | –    | gateway webhook — persisted to `payments`                            |
| `GET  /api/payment/status/:txId` | –    | verify a transaction                                                 |

## Authentication

Sign-in happens on the client against **Firebase Auth**, which returns an
**ID token — an RS256-signed JWT**. Every `✔` endpoint above requires
`Authorization: Bearer <idToken>`; `requireAuth` verifies the JWT
signature against Google's public keys and checks `aud` / `iss` / expiry.

- **No password ever reaches this service** — Firebase handles credentials,
  so there is nothing here to hash or store.
- Verification needs only `FIREBASE_PROJECT_ID`. A service-account key
  (`GOOGLE_APPLICATION_CREDENTIALS`) is optional, for extras like
  revocation checks.
- An invalid, forged or expired token gets `401`; if Firebase Admin cannot
  initialise at all the endpoint returns `503` rather than letting a
  request through.
- `AUTH_DEV_BYPASS=true` skips verification and trusts the bearer string as
  the uid — **local development and tests only**. The process refuses to
  start with it enabled while `NODE_ENV=production`.

## Tooling

- **Validation** — `zod` on every request body/query/params and on `env` at boot.
- **Security** — `helmet`, `express-rate-limit` (`/api/*`), `cors`, `compression`.
- **Logging** — `pino` + `pino-http` (pretty in dev, JSON in prod, silent in tests).
- **Tests** — `vitest run` — supertest hits `createApp()` with the DB forced offline.
- **Style** — ESLint (typescript-eslint) + Prettier; `husky` pre-commit runs
  `lint-staged` (`core.hooksPath` → `backend/.husky`, set by `npm install`).

## Environment

See `.env.example`. Highlights: `DATABASE_URL` (Supabase session-pooler
URI), `FIREBASE_PROJECT_ID`, `CORS_ORIGIN`, `PORT`, `FRONTEND_DIST`.
Full database guide: [`DATABASE.md`](DATABASE.md).

Without a database the ticket/review endpoints fall back to in-memory
stores, so the API still boots.
