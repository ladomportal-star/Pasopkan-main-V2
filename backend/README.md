# Pasopkan backend

Express + TypeScript API using Prisma and PostgreSQL. Supabase JWTs are verified against the project's public JWKS. No client-supplied identity is trusted without token verification.

## Setup

Run `npm ci`, copy .env.example to .env and configure DATABASE_URL and SUPABASE_URL. Follow [DATABASE.md](DATABASE.md) before applying migrations. Generate the client with `npm run db:generate`, then run `npm run dev`.

| Command             | Purpose                                                     |
| ------------------- | ----------------------------------------------------------- |
| npm run typecheck   | TypeScript checking                                         |
| npm run lint        | ESLint                                                      |
| npm test            | Temporary local PostgreSQL cluster and API/constraint tests |
| npm run build       | Generate Prisma client and bundle dist/server.js            |
| npm start           | Start production ESM build                                  |
| npm run db:generate | Generate Prisma client, NOT a SQL migration                 |
| npm run db:validate | Validate Prisma schema                                      |
| npm run db:migrate  | Deploy committed SQL migrations                             |
| npm run db:studio   | Open Prisma Studio                                          |

## Structure

- prisma/schema.prisma: relational models.
- prisma/migrations: versioned SQL, constraints, RLS and append-only audit trigger.
- src/lib/prisma.ts: adapter and shared client.
- src/services: business transactions and persistence.
- src/routes, controllers, validators, middlewares: API boundaries and authorization.
- tests: API tests with a local JWT issuer and an isolated database.

## Authorization and incomplete integrations

Business mutations require verified Supabase identity; checkout rejects anonymous sessions. Approved organizers can submit events; administrators publish them. Cancellation and refund approval are audited. Refund approval does not execute a remote transfer.

Google and Lao phone OTP login are supported through Supabase Auth. The browser calls the backend OTP endpoints; configure `SUPABASE_PUBLISHABLE_KEY`, enable the Supabase Phone provider, and configure either a supported SMS provider or a Send SMS Hook for the regional SMS API. Payment webhook processing is unavailable until the provider contract is implemented and verified. Payment status is authenticated and owner-scoped.

Media endpoints upload images to Supabase Storage and resolve stored references. Service-role credentials stay on the backend. Frontend media wiring and storage provisioning remain release blockers.

See [implementation status](../docs/prisma-implementation-status.md) for outstanding work. Never treat a successful build as production acceptance.

Phone authentication setup and its live acceptance checklist are documented in
[phone-auth-rollout.md](../docs/phone-auth-rollout.md).
