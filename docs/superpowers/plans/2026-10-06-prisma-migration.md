# Prisma migration implementation checklist

Approved scope: the production design in ../specs/2026-10-06-prisma-supabase-production-design.md.

Execute in the existing checkout, preserving API compatibility where safe. Never reset or migrate the configured live database. No deployment or automatic production migration is included.

- [ ] Install a pinned, mutually compatible Prisma CLI, client and PostgreSQL adapter.
- [ ] Define the new relational schema and generate an initial SQL migration offline.
- [ ] Establish an isolated database test harness and verify constraints.
- [ ] Replace user, event, notification, order, payment and check-in persistence with Prisma.
- [ ] Preserve ticket tier identities after sales and enforce stock/expiry atomically.
- [ ] Enforce registered-user checkout, organizer approval and admin event review.
- [ ] Add provider-neutral payment/refund boundaries and append-only audit records; leave unconfigured external providers disabled.
- [ ] Remove obsolete phone OTP integration and hide phone login until an adapter exists.
- [ ] Remove obsolete ORM/identity references and update setup documentation.
- [ ] Verify type checks, lint, integration tests and production builds, reporting external integration limitations explicitly.

Provider contract details (including Phajay webhook authentication and refunds) require actual vendor documentation before a live adapter is enabled. Database reconstruction means a NEW empty database; it is not authorization to erase the existing database.
