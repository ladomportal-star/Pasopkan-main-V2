# Account-only application access

All application pages require a registered account session. This includes discovery,
event details, checkout, profile/settings, informational pages, organizer tools and
admin/staff pages. `/login` and `/register` are the only unauthenticated UI routes.
The shared route boundary waits for session verification before mounting pages, so
protected data components and their loading requests do not run for guests. The
navigation bar is hidden while signed out. Existing role/ownership checks still apply
after login; signing in does not grant organizer, staff or admin permissions.

The backend router requires a verified Supabase JWT and rejects anonymous sign-in
sessions before application routes, including newly added routes, are reached.
API responses use `Cache-Control: private, no-store` and vary by Authorization.
Only these bootstrap/infrastructure endpoints bypass the account gate:

- `GET /api/health` for Railway health checks (no business data).
- `POST /api/otp/send` and `POST /api/otp/verify` for signing in; validation and rate limits still apply.
- `POST /api/webhook/payment` and `POST /api/payment/webhook` for gateway callbacks.
- The separately mounted Supabase send-SMS hook still verifies its webhook signature.

On logout or an authenticated API HTTP 401, account state is cleared and protected
pages unmount. Stale profile responses cannot restore a signed-out account. A failed
backend session/profile check does not fall back to displaying application pages.
An active account session can navigate normally without entering credentials on every
click. Refreshing or opening a direct URL checks the session before displaying data.

After sign-in, the browser returns only to a validated local path. OAuth stores that
path in sessionStorage for the redirect; external URLs and login/register loops are
rejected. Notifications are reset when the signed-in account changes.

Static application assets and existing public listing-image URLs are not secret data
endpoints. This change controls application pages and business APIs; it does not change
Supabase bucket visibility or revoke previously shared image URLs.

Regression checks are in `backend/tests/auth-access.test.ts` (unmounted pages and
safe return URLs) and `backend/tests/auth.test.ts` (verified JWTs, anonymous rejection,
API default-deny and sign-in bootstrap). `npm test` runs them against an isolated
temporary PostgreSQL cluster. Install dependencies in both `backend` and `frontend`
before running the suite: the route-boundary checks render the actual frontend
component using the frontend's React dependencies.
