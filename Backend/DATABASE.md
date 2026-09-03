# Database — Supabase (PostgreSQL) + Drizzle ORM

The API talks to PostgreSQL through [Drizzle ORM](https://orm.drizzle.team).
Schema lives in [`src/models/schema.ts`](src/models/schema.ts); generated SQL migrations
live in [`drizzle/`](drizzle/) and are committed.

If no database is configured the ticket / review endpoints fall back to
in-memory stores, so the app still runs.

---

## 1. Create the Supabase project

1. https://supabase.com → **New project**. Pick a region close to your
   users (e.g. `Southeast Asia (Singapore)` for Laos). Save the database
   password it generates.
2. Top bar **Connect → Connection string → URI**. You get three:

   | String | Host / port | Use it for |
   | --- | --- | --- |
   | **Session pooler** | `…pooler.supabase.com:5432` | everything — API server **and** migrations |
   | Direct connection | `db.<ref>.supabase.co:5432` | only if you have IPv4/IPv6 to it (paid add-on on Free tier) |
   | Transaction pooler | `…pooler.supabase.com:6543` | serverless only — **don't use here** |

   On the Free plan the direct host is IPv6-only, so use the **Session
   pooler** string for both the server and `db:migrate`.

   Copy it verbatim. If the DB password has symbols (`@ : / # ? space`),
   either percent-encode them (`@`→`%40`, …) or reset it to letters+digits
   under **Settings → Database → Reset database password**.

---

## 2. Configure the backend

In `Backend/.env`:

```dotenv
# Session pooler URI, copied from Connect → Connection string → URI
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
DATABASE_POOL_MAX=10
```

SSL is turned on automatically for any non-local host, so the
`?sslmode=require` suffix is optional. The old discrete `SQL_HOST` /
`SQL_USER` / … are used only when `DATABASE_URL` is empty.

---

## 3. Apply the schema

```bash
cd Backend

# Option A — versioned migrations (recommended, committed to git)
npm run db:migrate        # applies everything in drizzle/*.sql

# Option B — push the schema straight to the DB (fast, for prototyping)
npm run db:push
```

The Session pooler handles DDL fine, so the same `DATABASE_URL` works for
`db:migrate` and the running server.

> Supabase's dashboard "Last migration" stays "No migrations" — that only
> tracks the Supabase CLI. Drizzle records its own state in a
> `drizzle.__drizzle_migrations` table. Newly created tables will show an
> "RLS disabled" note; that is fine here because they are reached only
> through the backend's service connection, never the public anon key.

After editing `src/models/schema.ts`:

```bash
npm run db:generate -- --name=<change_summary>   # writes a new drizzle/NNNN_*.sql
npm run db:migrate
```

Inspect data with `npm run db:studio`.

---

## 4. Schema overview (core commerce)

```
organizers ──< events ──┬──< event_dates
                        ├──< ticket_tiers
                        ├──< ticket_zones
                        └──< coupons                (unique per event+code)

users ──< orders ──< order_items ──< check_ins      (1 check-in per ticket)
      └──< reviews                                   (unique per event+author)
```

| Table | What it holds |
| --- | --- |
| `users` | one row per Firebase account (`firebase_uid` unique) + role |
| `organizers` | event owners / promoters |
| `events` | the catalog entry — dates, venue, flags, media |
| `event_dates` | extra dates for `flexible` / `booking` events |
| `ticket_tiers` | price levels (`price_kip`, quantity, per-order limit) |
| `ticket_zones` | seating zones (capacity / sold) |
| `coupons` | percent or fixed-kip discounts, redemption limits |
| `orders` | one purchase — totals, payment, buyer, status |
| `order_items` | **one row per ticket**, each with a unique `ticket_code` (QR) |
| `check_ins` | gate scan of an `order_item` (unique → no double entry) |
| `reviews` | one review per (event, author) |

Conventions:

- **UUID** primary keys (`gen_random_uuid()`).
- Money is **integer kip** (`*_kip`) — LAK has no minor unit.
- `created_at` / `updated_at` are `timestamptz` defaulting to `now()`.
- Enums: `user_role`, `event_category`, `event_status`, `event_date_type`,
  `order_status`, `ticket_status`, `discount_type`.

### Event reference during transition

The catalog still lives in the frontend (`Frontend/data/events.ts`) and
Firestore. Until it is migrated:

- `orders.event_id` and `reviews.event_id` are **plain `text`** (no FK) —
  they store whatever id the client sends.
- `events.legacy_id` is reserved to map those ids to a real `events` row
  once the catalog moves into Postgres. At that point switch the two
  columns to `uuid` + FK.
