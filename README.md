# Pasopkan

Experience and ticketing platform. Two independent projects: run npm commands inside the relevant folder.

| Project | Stack |
| --- | --- |
| backend | Express, TypeScript, Prisma 7.10.0, PostgreSQL, Supabase Auth |
| frontend | React 19, Vite, Tailwind CSS v4, Supabase Auth client |

## Local setup

Use Node.js 24 (the verified development runtime), npm and PostgreSQL. A database is required; there is no in-memory data fallback or mock authentication.

1. Install dependencies with `npm ci` in both folders.
2. Copy each `.env.example` to `.env` and configure your own values. Never commit secrets.
3. Configure Google OAuth in the Supabase project used by both frontend and backend.
4. Follow [the database guide](backend/DATABASE.md) to provision a NEW empty database.
5. In backend, run `npm run db:generate`, then `npm run dev`.
6. In frontend, run `npm run dev`. The development server proxies /api to the backend on port 3000.

## Architecture and verification

Business data flows through the backend API and Prisma. Supabase Auth provides identity; Supabase Storage is the target media service. Store media references, not image data, in the application database.

Backend: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
Frontend: `npm run lint`, `npm run build`.

The backend build produces dist/server.js; start it with `npm start`. Configure CORS_ORIGIN explicitly in production. Frontend builds into dist and uses `VITE_API_URL` to call the separately deployed backend. See [the production deployment guide](docs/production-deployment.md) for the Vercel, Railway, DNS and Supabase settings.

## Release status

This migration is not yet production-ready. Paid checkout and phone OTP are disabled until verified provider adapters are available. Media frontend wiring and administrative workflows need completion. Read [implementation status and release blockers](docs/prisma-implementation-status.md) before deployment.
