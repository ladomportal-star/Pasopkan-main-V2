# Pasopkan Backend

Express + TypeScript API. Talks to PostgreSQL (Supabase) through Drizzle
ORM and verifies Firebase ID tokens. Runs standalone on port `3000`; the
Frontend project calls it over HTTP.

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL, FIREBASE_PROJECT_ID, …
npm run dev               # tsx watch, http://localhost:3000
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start with auto-reload (`tsx watch src/server.ts`) |
| `npm run build` | Bundle to `dist/server.cjs` (esbuild) |
| `npm run start` | Run the built server (`NODE_ENV=production`) |
| `npm run lint` | Type-check (`tsc --noEmit`) |
| `npm run db:generate` | Generate a new SQL migration from the schema |
| `npm run db:migrate` | Apply migrations in `drizzle/` |
| `npm run db:push` | Push the schema straight to the DB (prototyping) |
| `npm run db:studio` | Open Drizzle Studio |

## Layout

```
src/
├── config/       env.ts (typed env)  ·  database.ts (pg Pool + Drizzle)
├── controllers/  thin request handlers, one per resource
├── routes/       path → controller wiring, mounted in routes/index.ts
├── services/     business logic + in-memory fallbacks
├── models/       Drizzle schema (schema.ts) + barrel (index.ts)
├── middlewares/  auth.middleware.ts  ·  error.middleware.ts
├── types/        express.d.ts (augments Request with `user`)
├── utils/        logger.ts  ·  response.util.ts
├── app.ts        builds the Express app
└── server.ts     entry point — listen, graceful shutdown

drizzle/          committed SQL migrations
drizzle.config.ts drizzle-kit config (schema → src/models/schema.ts)
```

Request flow: `route → (requireAuth) → controller → service → models/db`.

## Environment

See `.env.example`. Highlights: `DATABASE_URL` (Supabase session-pooler
URI), `FIREBASE_PROJECT_ID`, `CORS_ORIGIN`, `PORT`, `FRONTEND_DIST`.
Full database guide: [`DATABASE.md`](DATABASE.md).

Without a database the ticket/review endpoints fall back to in-memory
stores, so the API still boots.
