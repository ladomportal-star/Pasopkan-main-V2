# Public event discovery and account-only event details

The home page and category event catalogs are public. They show only public events
from the Backend API; no demo data is used. Opening an individual event at `/event/:id`
requires a registered account and sends signed-out visitors to `/login`, then returns
them to the selected event after sign-in. Checkout, profile/settings, organizer tools,
and admin/staff pages also require an account. Existing role/ownership checks still
apply after login; signing in does not grant organizer, staff or admin permissions.

The backend router requires a verified Supabase JWT for application APIs by default.
The public `GET /api/events` catalog is an explicit exception; it returns only public,
published, sold-out, or completed events. `GET /api/events/:id` and all writes remain
protected. API responses use `Cache-Control: private, no-store` and vary by
Authorization. These endpoints bypass the account gate:

- `GET /api/health` for Railway health checks (no business data).
- `GET /api/events` for public event discovery (published public data only).
- `POST /api/otp/send` and `POST /api/otp/verify` for signing in; validation and rate limits still apply.
- `POST /api/webhook/payment` and `POST /api/payment/webhook` for gateway callbacks.
- The separately mounted Supabase send-SMS hook still verifies its webhook signature.

On logout or an authenticated API HTTP 401, account state is cleared and protected
pages unmount. Stale profile responses cannot restore a signed-out account. A failed
backend session/profile check does not fall back to displaying application pages.
An active account session can navigate normally without entering credentials on every
click. Refreshing or opening a protected direct URL checks the session before
displaying data.

After sign-in, the browser returns only to a validated local path. OAuth stores that
path in sessionStorage for the redirect; external URLs and login/register loops are
rejected. Notifications are reset when the signed-in account changes.

Static application assets and existing public listing-image URLs are not secret data
endpoints. This change controls application pages and business APIs; it does not change
Supabase bucket visibility or revoke previously shared image URLs.

Regression checks are in `backend/tests/auth-access.test.ts` (public discovery,
protected pages, and safe return URLs) and `backend/tests/auth.test.ts` (verified JWTs,
public catalog access, protected event details, API default-deny and sign-in bootstrap).
`npm test` runs them against an isolated
temporary PostgreSQL cluster. Install dependencies in both `backend` and `frontend`
before running the suite: the route-boundary checks render the actual frontend
component using the frontend's React dependencies.
