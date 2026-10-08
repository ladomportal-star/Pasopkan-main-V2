# Prisma implementation status — 2026-10-08

This is an implementation checkpoint, not production deployment approval. The existing Supabase project now has the initial Prisma schema; no legacy table was reset or deleted and no provider payment was initiated.

## Verified locally

- Prisma 7.10.0 client, PostgreSQL adapter and initial relational migration.
- Backend type-check, ESLint and ESM production build.
- Isolated PostgreSQL suite: 3 schema/constraint tests and 59 API/flow tests passed.
- Organizer approval before event creation; submitted events require administrator publication.
- Published event edits by organizers return to review and are audited.
- Administrator-only cancellation is idempotent; closed events cannot be reopened through ordinary updates.
- Order creation and moderation share an event row lock. Inventory is reserved atomically; reservation expiry uses the database clock, matching the expiry worker.
- Frontend event submission requests review, not publication. Zero ticket capacity is preserved as zero, not unlimited.
- Direct browser-to-Phajay requests, embedded gateway credential and browser-driven payment confirmation were removed from Checkout. Paid checkout is deliberately unavailable; free checkout remains available.
- The demo `123456` OTP prompt was removed. Free checkout asks the backend to reject any nonzero-price order and only shows success for a confirmed, zero-total order.
- The existing Supabase project had 11 empty lowercase legacy tables. The reviewed additive initial migration created 14 separate Prisma tables and was baselined in Prisma migration history; `prisma migrate status` reports up to date. The legacy tables remain untouched.
- The `listing-media` (public) and `private-media` (private) buckets and backend-only object policy were applied and read back. A local production-mode backend returned HTTP 200 with database connected; a `https://pasopkan.la` CORS preflight returned HTTP 204 with the expected origin.
- Active setup documentation and environment examples now describe Prisma and Supabase. Obsolete ORM/identity tooling references and unused OTP-provider configuration were removed. Historical design records remain for context; no cloud resources were deleted.

## Security action for the operator

An embedded gateway credential existed in the previous frontend source. If it was live, revoke/rotate it with the provider and review its use. Removing it from source does not revoke it or erase Git history and previously deployed bundles. Never place replacement credentials in frontend environment variables.

## Remaining before production

- Frontend image fields now upload through the backend and keep canonical storage references separate from display URLs. Storage provisioning is complete in the selected project; live upload, cross-account access and browser validation in [storage-rollout.md](storage-rollout.md) remain outstanding.
- Organizer application and administrator review screens are now API-backed at /organizer and /admin, linked from Account. Event rejection reasons and resubmission are supported. Browser end-to-end validation and broader legacy dashboard replacement remain outstanding.
- Implement and test the provider-neutral payment execution worker, authenticated webhook verification, idempotent processing and reconciliation against actual Phajay documentation. Refund approval currently records approval only; it does not transfer money.
- Phone OTP API and UI are implemented through Supabase Auth with per-route rate limits. Live SMS remains blocked until the operator enables the Supabase Phone provider and configures either its SMS provider or a Send SMS Hook for the regional provider API.
- Exercise refund amount/concurrency scenarios and full browser end-to-end flows. Current passing tests are not evidence of a live gateway integration or production readiness.
- Investigate PostgreSQL client concurrent-query deprecation warnings and frontend large-bundle warnings.

## Safe database rollout

The selected Supabase project already contained empty legacy tables, so ordinary `prisma migrate deploy` initially returned P3005. After checking all 14 table names and seven enum names for collisions, the initial SQL was applied in one transaction and recorded with `prisma migrate resolve --applied 20261006000000_initial`. Future deployments use `npm run db:migrate` normally. Do not rerun the initial SQL, reset this database, or remove the legacy tables without a separate data-retention decision. `npm test` provisions its own temporary loopback PostgreSQL cluster and does not use the application database URL.
