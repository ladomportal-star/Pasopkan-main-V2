# Event roles and gate access

Pasopkan has four **functional** roles. Platform `User.role` remains `user`, `organizer`, or `admin`; Staff is an event-scoped assignment, not a platform-wide role. One user can therefore buy tickets and serve as staff for one or more events without gaining organizer or platform-admin privileges.

| Function | Scope | Allowed operations |
| --- | --- | --- |
| User | Own account/orders | Browse published events, reserve tickets, view own orders. |
| Organizer | Events owned by approved organizer profile | Create drafts, submit for review, manage own events, assign/revoke staff for own events, scan own events. |
| Staff | Explicit active `EventStaff` assignment | List assigned events, preview tickets, check in tickets, and view check-ins for those events only. Cannot change events or other staff assignments. |
| Admin | Platform-wide | Create and edit events without an organizer application, review organizers and events, approve refunds, assign/revoke and scan staff access for every event. |

The backend verifies a Supabase access token on every protected request. Staff assignment by email uses `User.authEmail`, populated only from the verified token's email claim; the editable profile email is never used to grant scanner access. A prospective staff member must sign in after this migration before an organizer can assign them by email. Assignment and revocation create audit records. Revocation prevents subsequent ticket lookup, check-in, and event check-in listing.

`Event.organizerId` remains required. When an admin creates their first event, the backend creates the necessary owner record automatically in the same transaction. This is not an organizer application and does not change `User.role` from `admin`. An organizer must still have both the `organizer` role and an approved organizer record; a stale record after a role change grants no access. Both admin- and organizer-created events follow the draft → pending review → published workflow. Admin review and status changes are audited.

## API

- `GET /api/events/:id/staff` — organizer of the event or admin lists active staff.
- `GET /api/admin/events?limit=50&cursor=...` — admin-only, paginated list of events in every status; the UI uses it for event and staff management.
- `POST /api/events/:id/staff` with `{ "email": "staff@example.com" }` — assign an existing, signed-in account.
- `DELETE /api/events/:id/staff/:userId` — revoke that event's assignment.
- `GET /api/checkins/events` — events where the caller may scan.
- `GET /api/checkins/lookup/:code` — preview a ticket; no check-in is recorded.
- `GET /api/checkins?eventId=:id` — authoritative check-in list.
- `POST /api/checkins` with `{ "ticketCode": "...", "eventId": "uuid", "gate": "..." }` — authoritative check-in. The UI reports success only after this API confirms it.

The scan endpoint rejects tickets for another event, unpaid/void/refunded tickets, and callers without event access. Repeated scans of an already checked-in ticket return `already_checked_in` without a second record.

## Remaining work outside this change

Paid ticket settlement and provider-executed refunds remain disabled until the payment integration is configured and verified. Phone-only accounts have no token email and cannot currently be assigned through the email-based staff invitation form.
