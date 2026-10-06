# Pasopkan Prisma and Supabase Production Design

## Goal

Replace Drizzle, Firebase, and Firestore with a production-oriented Prisma/PostgreSQL backend that uses Supabase only for authentication and object storage. Preserve the public API where practical while removing legacy identifiers and enforcing relational integrity.

## Decisions

- PostgreSQL and Prisma are the sole source of truth for business data and migrations.
- Supabase Auth is the sole identity provider. `User.authId` is the unique Supabase JWT subject.
- The browser uses Supabase only for Auth and Storage. It accesses business data only through the Backend API.
- Google OAuth is available through Supabase. Phone authentication is implemented behind a provider-neutral server interface and remains hidden/disabled until a real SMS provider is configured; no mock or bypass OTP exists.
- Money is stored as an integer number of Lao kip with `currency = LAK`; currency stays explicit for future expansion.
- Events use general admission only. Seating-map media is informational; no seat or zone reservation is in scope.
- Organizers and event publication require Admin approval.
- Payment processing supports multiple providers, with Phajay as the first adapter. Gateway webhooks are verified and idempotent.
- Refunds are explicit records. Event cancellation creates pending refund requests; an Admin must approve each before Phajay is called.
- Pending paid orders reserve inventory for 15 minutes, then an expiry worker voids them and releases stock.

## Domain model

```text
User ──< OrganizerApplication
User ── 0..1 Organizer ──< Event ──< EventDate
                                     └──< TicketTier
User ──< Order ──< OrderItem ── 0..1 CheckIn
                  └──< Payment ──< Refund
User ──< Notification
User ──< AuditLog (actor)
```

### Models and invariants

| Model | Responsibility and invariants |
| --- | --- |
| `User` | Application profile for one Supabase Auth identity. `authId` is unique; roles are `USER`, `ORGANIZER`, `ADMIN`. |
| `OrganizerApplication` | A user request with `PENDING`, `APPROVED`, or `REJECTED` state, reviewer and decision metadata. Approval creates the applicant's one `Organizer`. |
| `Organizer` | Public profile owned by one User and parent of many Events. |
| `Event` | Owned by one Organizer. States are `DRAFT`, `PENDING_REVIEW`, `PUBLISHED`, `REJECTED`, `CANCELLED`, `COMPLETED`; reviewer, review time and rejection reason are retained. |
| `EventDate` | Optional date/time capacity data for an Event. |
| `TicketTier` | General-admission price, limits, active state and integer `quantitySold`. Inventory is changed only in a database transaction. |
| `Order` | Belongs to one User and Event. States include `PENDING`, `CONFIRMED`, `CANCELLED`, `REFUNDED`. No client-provided price or ownership field is trusted. |
| `OrderItem` | One issued ticket tied to one Order and TicketTier. `ticketCode` is unique; it has at most one CheckIn. |
| `CheckIn` | One immutable admission record per OrderItem. |
| `Payment` | A provider-neutral payment attempt for an Order. `(provider, providerTransactionId)` is unique; statuses are provider-normalized. |
| `Refund` | A reversal against one successful Payment. Sum of successful refunds cannot exceed the payment amount; approval and provider references are retained. |
| `Notification` | User inbox entry with read state and optional deep-link metadata. |
| `AuditLog` | Append-only security record: actor, action, subject type/ID, time, request context, and safe before/after metadata. |

All financial amounts are integer kip. Relations use UUID foreign keys and explicit PostgreSQL indexes for lookup, ownership, status, and worker queries. There are no Firebase UIDs, Firestore references, legacy event IDs, guest orders, zone reservations, or base64 media fields.

## Application architecture

### Prisma and data access

- `Backend/prisma/schema.prisma` defines the complete PostgreSQL schema.
- `Backend/prisma/migrations/` contains only Prisma migration history; it begins with one fresh initial migration for a new database.
- `Backend/src/lib/prisma.ts` exposes a single `PrismaClient` instance.
- Services own transactions and business rules; controllers remain thin and validators define request contracts.
- The old Drizzle schema, migration folder, database client, dependencies, scripts, snapshots and documentation are removed.

### Auth and authorization

- Backend middleware verifies Supabase JWTs against the Supabase JWKS and derives the requesting user from `sub`.
- RBAC protects organizer, admin, refund, review and check-in operations. Every privilege-changing action creates an AuditLog entry in the same transaction.
- Supabase RLS denies browser access to business tables. The backend uses its server database connection; no service-role secret reaches the browser.
- Google OAuth is handled by Supabase Auth. A future `SmsOtpProvider` abstraction supports the send and verify steps for any server-side SMS provider. The provider adapter, secrets, rate limits, expiry and failed-attempt policy are configured before enabling the phone-login UI.

### Media

- Public event, organizer and listing media are stored in a Supabase Storage public bucket.
- Avatars and sensitive application documents are stored in private buckets and served with signed URLs.
- Database records store storage keys and metadata rather than base64 payloads. Backend validation enforces ownership, content type, and file-size limits.

### Payments and refunds

- A `PaymentProvider` interface separates provider-independent order logic from a `PhajayPaymentProvider` adapter.
- Webhooks validate the configured signature/secret, record the inbound event safely, and re-check the transaction with the provider before confirming payment and order state.
- Provider transaction uniqueness and database transactions make webhook processing idempotent.
- Event cancellation creates `PENDING_APPROVAL` Refund records. An Admin approval invokes the provider; the resulting provider status drives Refund and Order state, with an AuditLog entry.

### Inventory and background work

- Creating a paid order locks/reserves inventory atomically in a Prisma transaction and creates `PENDING` order items.
- A scheduled expiry worker finds pending orders older than 15 minutes, marks them cancelled/void, restores each tier's inventory atomically, and records the operation.
- A confirmed payment before expiry confirms the order; duplicate settlement events have no additional effect.

## API compatibility and frontend migration

- Existing frontend API request/response shapes are retained where doing so does not conflict with ownership or security. IDs returned by the new API are UUIDs.
- Rename Firebase/Firestore compatibility aliases (for example `syncProfileToFirestore`) to Supabase/API terminology and remove the old references.
- Replace local base64 uploads with the Storage upload flow and persist returned storage keys through the Backend API.
- Hide phone login until the SMS provider adapter and credentials are configured; retain Google sign-in.

## Reliability, security, and deployment

- Use Zod validation, explicit error mapping, structured logs with redaction, rate limits for sensitive endpoints, CORS allow lists, Helmet, and request IDs.
- Store database URLs, Supabase server keys, Phajay credentials, webhook secrets, and SMS credentials in environment-specific secret management. Never expose them in frontend variables or commits.
- Use separate development, test, staging, and production databases. Tests never run against a developer or production Supabase database.
- Deploy schema changes with `prisma migrate deploy`; do not use destructive reset/push in production.
- Configure Supabase Auth redirect URLs, Google OAuth credentials, RLS policies, bucket policies, and a bootstrapped Admin account before release.

## Testing and acceptance criteria

Tests must cover:

1. Prisma model constraints and foreign-key behavior.
2. Supabase JWT authentication, role enforcement, and absence of guest checkout.
3. Organizer application and event-review state transitions.
4. Atomic inventory reservation, 15-minute expiry, and stock restoration.
5. Payment verification, duplicate webhooks, and provider adapter failures.
6. Refund creation, approval, partial-refund ceiling, and provider outcomes.
7. Audit log creation for all privileged and financial state transitions.
8. Storage authorization, media validation, and no base64 persistence.
9. Backend type-check, lint, integration tests, frontend type-check and production builds.

The migration is accepted when the repository contains no runtime Drizzle, Firebase, or Firestore dependency/reference; a new database can be migrated with Prisma; the protected flows pass automated tests; and setup documentation describes a reproducible secure deployment.

## Out of scope

- Migrating data from a prior database.
- Guest checkout.
- Seat or zone reservation.
- Enabling phone authentication before a real SMS provider/API is supplied.
- Additional payment-provider adapters beyond Phajay.
