# Prisma implementation status — 2026-10-06

This is an implementation checkpoint, not production deployment approval. No application database was reset or migrated and no provider payment was initiated.

## Verified locally

- Prisma 7.10.0 client, PostgreSQL adapter and initial relational migration.
- Backend type-check, ESLint and ESM production build.
- Isolated PostgreSQL suite: 3 schema/constraint tests and 53 API/flow tests passed.
- Organizer approval before event creation; submitted events require administrator publication.
- Published event edits by organizers return to review and are audited.
- Administrator-only cancellation is idempotent; closed events cannot be reopened through ordinary updates.
- Order creation and moderation share an event row lock. Inventory is reserved atomically; reservation expiry uses the database clock, matching the expiry worker.
- Frontend event submission requests review, not publication. Zero ticket capacity is preserved as zero, not unlimited.
- Direct browser-to-Phajay requests, embedded gateway credential and browser-driven payment confirmation were removed from Checkout. Paid checkout is deliberately unavailable; free checkout remains available.
- Active setup documentation and environment examples now describe Prisma and Supabase. Obsolete ORM/identity tooling references and unused OTP-provider configuration were removed. Historical design records remain for context; no cloud resources were deleted.

## Security action for the operator

An embedded gateway credential existed in the previous frontend source. If it was live, revoke/rotate it with the provider and review its use. Removing it from source does not revoke it or erase Git history and previously deployed bundles. Never place replacement credentials in frontend environment variables.

## Remaining before production

- Frontend image fields now upload through the backend and keep canonical storage references separate from display URLs. Storage provisioning SQL and a live acceptance checklist are in [storage-rollout.md](storage-rollout.md). Applying that SQL to an authorized project, legacy media transfer and real browser validation remain outstanding.
- Organizer application and administrator review screens are now API-backed at /organizer and /admin, linked from Account. Event rejection reasons and resubmission are supported. Browser end-to-end validation and broader legacy dashboard replacement remain outstanding.
- Implement and test the provider-neutral payment execution worker, authenticated webhook verification, idempotent processing and reconciliation against actual Phajay documentation. Refund approval currently records approval only; it does not transfer money.
- Configure the future SMS provider; phone authentication remains disabled.
- Exercise refund amount/concurrency scenarios and full browser end-to-end flows. Current passing tests are not evidence of a live gateway integration or production readiness.
- Investigate PostgreSQL client concurrent-query deprecation warnings and frontend large-bundle warnings.

## Safe database rollout

Provision a NEW empty PostgreSQL database for this schema. Review the initial SQL, connection-role privileges and RLS behavior first. Set backend `DATABASE_URL` and optionally `DIRECT_DATABASE_URL` to that new database, then use `npm run db:generate` and `npm run db:migrate` from `backend`. Never run reset commands or point this initial migration at an existing populated database without a separately reviewed migration strategy. `npm test` provisions its own temporary loopback PostgreSQL cluster and does not use the application database URL.
