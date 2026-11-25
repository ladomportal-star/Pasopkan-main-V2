# Pasopkan — working rules for Claude Code

Read `CONTEXT.md` for the business terms (Order, Payment, Refund, Organizer, …).

## Layout

- `backend/` — Express + Prisma API, deployed to **Railway** as `https://api.pasopkan.la`.
- `frontend/` — React + Vite app, deployed to **Vercel** as `https://pasopkan.la`.
- Both deploy automatically from the `main` branch. **Merging to `main` is a production
  deploy.** Railway also runs `npm run db:migrate` before each backend deploy.
- PhaJay payments are in **live** mode in production: checkout and refunds move real money.

## Workflow: edit → check → deploy

1. Start from an up-to-date `main` and create a branch: `fix/<topic>` or `feat/<topic>`.
   Never commit directly to `main`.
2. Make the change. Add or update tests under `backend/tests/` for any backend behaviour change,
   especially payments, orders, refunds, check-in and access control.
3. Commit and push the branch. GitHub Actions (`.github/workflows/ci.yml`) runs:
   - backend: `npm ci`, `npx prisma generate`, `npm run typecheck`, `npm test`
     (tests start their own throwaway PostgreSQL; they never touch a real database)
   - frontend: `npm ci`, `npm run lint` (tsc), `npm run build`
4. Open a pull request into `main`. Merge only when CI is green.
5. After merging, check production:
   - `https://api.pasopkan.la/api/health` returns `"status":"ok"` and `"database":"connected"`.
   - The homepage and an event page load without console errors.
   - For admin-facing changes, recheck the admin dashboard at `/PskAdmin` (read-only).

If Node.js is not installed on the machine, CI is the only place the code is type-checked and
tested — do not merge a branch whose CI has not passed.

## Rules for risky areas

- **Payments** (`backend/src/services/payment.service.ts`): the webhook and the status poll must
  settle through `settlePaidPayment`. A completed payment only ever moves to `refunded`.
- **Refunds**: PhaJay refunds whole transactions only; never approve or create partial refunds.
- **Rich text**: organizer-written HTML (event descriptions) must go through
  `frontend/src/lib/sanitizeHtml.ts` before any `dangerouslySetInnerHTML` or `innerHTML`.
- **Database changes**: add a new folder under `backend/prisma/migrations/`; never edit an existing
  migration — production has already applied them.
- Never commit `.env` files or credentials. Secrets live in Railway and Vercel settings.
- Never test checkout or refunds against production; use a staging backend with PhaJay sandbox.
