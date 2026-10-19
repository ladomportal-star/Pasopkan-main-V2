# Production deployment: Vercel + Railway

Pasopkan is deployed as two services. The browser only receives public Vite and
Supabase values; database credentials and service-role secrets stay on Railway.

```text
Browser -> https://pasopkan.la          (Vercel / Frontend)
Browser -> https://api.pasopkan.la/api  (Railway / Backend)
Backend -> PostgreSQL + Supabase Auth/Storage
```

## 1. Deploy the backend to Railway

Create a Railway service from this repository and configure:

- Root Directory: `/backend`
- Config file path: `/backend/railway.json` (Railway resolves this from the
  repository root, not from the service Root Directory)
- Healthcheck: `GET /api/health` (already defined in `railway.json`)
- Pre-deploy migration: `npm run db:migrate` (already defined)

Set these Railway variables with real values. Never add them to Git:

```dotenv
NODE_ENV=production
DATABASE_URL=<Supabase session-pooler URL>
DIRECT_DATABASE_URL=<Supabase direct database URL>
DATABASE_POOL_MAX=10
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable key>
SUPABASE_SERVICE_ROLE_KEY=<service-role secret>
CORS_ORIGIN=https://pasopkan.la,https://www.pasopkan.la
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=300
```

Railway supplies `PORT`; do not set a fixed production port. A deployment is
ready only when `https://<railway-domain>/api/health` returns HTTP 200 with
`database: "connected"`.

## 2. Connect `api.pasopkan.la` to Railway

In Railway, add the custom domain `api.pasopkan.la`. Railway displays the exact
CNAME target and may also display a TXT ownership record. Copy those values to
the DNS provider:

| Type  | Name                      | Value                                   |
| ----- | ------------------------- | --------------------------------------- |
| CNAME | `api`                     | `<target shown by Railway>`             |
| TXT   | `<name shown by Railway>` | `<verification value shown by Railway>` |

Remove any existing `api` A/AAAA/CNAME record that points to Vercel before
adding Railway's record. Do not guess the CNAME value. Wait until Railway shows
the custom domain and TLS certificate as active.

## 3. Deploy the frontend to Vercel

Import the same repository as a separate Vercel project and configure:

- Root Directory: `frontend`
- Framework Preset: Vite
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: `dist`

Set these Vercel variables for Production:

```dotenv
VITE_API_URL=https://api.pasopkan.la
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable or legacy anon key>
```

`VITE_*` values are bundled into browser JavaScript, so never place a Supabase
service-role key or database credential in them. `frontend/vercel.json` keeps
React Router deep links working and prevents stale service-worker caching.

Add `pasopkan.la` and `www.pasopkan.la` in Vercel Domains. Use the A/CNAME
records Vercel shows, then choose one canonical domain and redirect the other.
For preview deployments, use a staging backend or add the preview project's
stable Vercel origin explicitly to Railway's `CORS_ORIGIN`; production CORS
intentionally does not trust every `*.vercel.app` site.

## 4. Configure Supabase Auth

In Authentication -> URL Configuration:

- Site URL: `https://pasopkan.la`
- Production redirect URL: `https://pasopkan.la/**`
- Optional canonical alias: `https://www.pasopkan.la/**`
- Local development: `http://localhost:5173/**`
- Optional Vercel previews: the narrow project/team wildcard shown in Supabase
  documentation; do not use a broad production wildcard.

In Google Cloud, the OAuth redirect URI remains Supabase's callback:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

The Google consent-screen application name, logo and authorized domain are
managed in Google Cloud, not in frontend code.

### Organizer phone verification

The Create Event button opens `/create`. A signed-in user must link a Lao
mobile number (`+85620XXXXXXXX`) to the **same Supabase Auth account**, verify
the `phone_change` SMS OTP, submit an Organizer application, and wait for Admin
approval. Only then does the event editor open. The backend reads the confirmed
phone from Supabase Auth with `SUPABASE_SERVICE_ROLE_KEY`; a phone typed into an
editable profile does not count. Admins retain their separate event-creation
bypass, as documented in the role model.

In the Supabase dashboard, open Authentication → Sign In / Providers → Phone.
Enable the Phone provider and configure a supported SMS provider or Send SMS
Hook with production credentials. Configure sender/coverage for Lao numbers,
review OTP rate limits and delivery costs, then test with a real phone. On
2026-10-12 the current project showed Phone **disabled** and the selected
Twilio credential fields **blank**; the new flow will fail closed until SMS
delivery is configured. Do not enter credentials in Git or browser build vars.

## 5. Production smoke test

Run these checks after DNS and TLS are active:

1. Open `https://api.pasopkan.la/api/health`; expect HTTP 200, status `ok`, and
   database `connected`.
2. Open `https://pasopkan.la/login`, sign in with Google, and confirm the browser
   returns to `https://pasopkan.la`.
3. In browser DevTools -> Network, verify API requests go to
   `https://api.pasopkan.la/api/...`, include the Bearer token on all application-data
   calls, and have no CORS error.
4. Refresh a deep link such as `https://pasopkan.la/login`; it must not return
   a Vercel 404.
5. Test account sync, event listing, media upload/read, order reservation and
   admin approval with a staging account before enabling real payments.
   Before sign-in, direct application links must redirect to `/login`, and
   `/api/events` must return HTTP 401 without data. Health and OTP bootstrap
   remain accessible. See [account-only access](authentication-access.md).
6. With a staging Google account, click Create Event, enter a Lao phone, send
   and verify a real OTP, submit an Organizer application, approve it as Admin,
   and confirm the event editor opens. Also verify an unconfirmed phone or
   unapproved account receives HTTP 403 when posting to `/api/events`.

If the health endpoint returns 503, inspect Railway logs and database URLs. If
the browser reports CORS errors, compare its exact origin (scheme + host) with
`CORS_ORIGIN`; redeploy Railway after changing variables.
