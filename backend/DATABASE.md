# Database — PostgreSQL + Prisma

The canonical schema is prisma/schema.prisma. Committed SQL migrations live in prisma/migrations. Prisma client code is generated into src/generated/prisma and is not committed.

## Safety boundary

The initial migration was applied to the selected Supabase project after a collision check and baselined in Prisma history. The 11 empty legacy Drizzle tables were removed by the guarded follow-up migration; it refuses to remove a non-empty table. Neither migration converts populated legacy data. Do not reset or overwrite the application database. Any future legacy data conversion requires a separately reviewed rollout.

## Connections and migration

Set DATABASE_URL for application connections. Set DIRECT_DATABASE_URL for migration connections when a separate direct endpoint is needed. Both must target the intended database. Prisma CLI uses DIRECT_DATABASE_URL when supplied, otherwise DATABASE_URL. Discrete SQL_* settings are application-only and do not configure Prisma CLI.

From backend:

```sh
npm ci
npm run db:generate
npm run db:validate
npm run db:migrate
```

db:generate generates the client only. db:migrate runs prisma migrate deploy. Future schema changes require a new reviewed SQL migration; never edit an already applied migration. Do not use reset commands on a populated environment.

Use provider-appropriate TLS verification and trust configuration. DATABASE_SSL=true requests certificate verification for the application pg adapter; connection-string TLS settings also affect pg. Do not disable certificate verification to bypass a connection error.

## Model boundaries

Users map to Supabase identities by unique authId. Organizer applications require administrative review. Events belong to approved organizers and carry publication review state. Ticket tiers have integer LAK prices and capacity counters. Orders reserve stock for 15 minutes; free orders confirm immediately. Order items retain price and ticket snapshots.

Payments identify a provider and provider transaction. Refunds are separate records, with administrator approval before provider execution. AuditLog rejects updates and deletes. Zone/seat allocation is deferred.

The initial migration enables business-table RLS and revokes anon/authenticated privileges when those roles exist. Browser clients must use the backend API, not direct business-table queries. Review runtime database-role privileges and Supabase exposure settings before deployment.

## Tests

npm test creates an isolated temporary PostgreSQL cluster on loopback and applies committed migrations. It does not read the application DATABASE_URL. Set POSTGRES_BIN to the installed PostgreSQL bin directory if necessary; the Windows default is PostgreSQL 18. Each API test file gets a separate schema. The harness stops its cluster and retains temporary diagnostic files.

Do not run test:watch against a live database. Watch mode requires the isolated PRISMA_TEST_DATABASE_URL test environment.

## Media

Supabase Storage is separate from the application schema. Provision listing-media for public listing images and private-media for private images. Review storage policies so clients cannot overwrite or enumerate other users' private objects. The backend uses a service-role credential to upload and sign authorized private references.

The selected Supabase project's buckets and backend-only object policy were provisioned separately from Prisma. Live upload and cross-account verification remain; see [remaining rollout work](../docs/prisma-implementation-status.md).
