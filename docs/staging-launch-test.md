# Staging launch test: PhaJay sandbox + real Wenova SMS

Run this on a **staging** copy before taking real money. Automated tests mock
PhaJay and Wenova, so only this run proves the real providers behave the way
the code expects. Write the result of every step in the table at the end.

## 0. Set up staging (once)

| Piece    | What to use                                                                 |
| -------- | --------------------------------------------------------------------------- |
| Backend  | A second Railway service from the same repo (e.g. `api-staging.pasopkan.la`) |
| Database | A separate Supabase project. Never test against production data.            |
| Frontend | A Vercel preview deployment with `VITE_API_URL` = staging API               |

Railway variables for the staging backend (same names as production):

```dotenv
NODE_ENV=production
PAYMENT_PROVIDER=phajay
PAYMENT_API_BASE_URL=https://payment-gateway.phajay.co
PAYMENT_API_KEY=<PhaJay sandbox devSecretKey>
PHAJAY_ENVIRONMENT=sandbox
SUPABASE_SEND_SMS_HOOK_SECRET=<staging Supabase hook secret>
WENOVA_SMS_TOKEN=<Wenova token>
WENOVA_SMS_HEADER=<approved sender name>
CORS_ORIGIN=<exact Vercel preview origin>
```

In the PhaJay portal, set the sandbox callback/webhook URL to
`https://<staging-api>/api/webhook/payment`. In the staging Supabase project,
point Authentication → Hooks → Send SMS to `https://<staging-api>/api/auth-hooks/send-sms`
and enable the Phone provider.

## 1. Readiness

| #   | Do                                         | Pass when                                                                          |
| --- | ------------------------------------------ | ---------------------------------------------------------------------------------- |
| 1.1 | Open `https://<staging-api>/api/health`    | HTTP 200, `database: "connected"`                                                  |
| 1.2 | Open `https://<staging-api>/api/webhook/payment` | `configured: true`, `adapterRegistered: true`, `environment: "sandbox"`      |
| 1.3 | Railway deploy logs                        | No `[env]` warnings about payment, SMS hook or CORS                                |

## 2. Wenova SMS (real phones)

Note the Wenova balance before you start; you will compare it at the end.

| #   | Do                                                                    | Pass when                                                                                  |
| --- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 2.1 | Log in with a phone number                                            | SMS arrives in under 30 s, sender name is correct, code works                              |
| 2.2 | Repeat 2.1 with one number from each network you can get (LTC, Unitel, ETL, Best/TPlus) | Every network receives it                                                    |
| 2.3 | Enter a wrong code                                                    | Clear error; the right code still works afterwards                                         |
| 2.4 | Press "send code" 6 times within 10 minutes                           | 6th request is refused with "Too many OTP attempts"                                        |
| 2.5 | As an approved organizer, submit an event                             | Event-submission code SMS arrives and the event goes to "pending review"                   |
| 2.6 | Compare the Wenova balance                                            | Charged once per SMS you asked for (no duplicates)                                         |
| 2.7 | Supabase table `SmsHookDelivery`                                      | Every row is `sent`; none stuck in `pending`                                                |

## 3. PhaJay payments (sandbox)

Create a staging event with a paid ticket type (small price, e.g. 1,000 LAK) and
get it approved by an admin. Use a normal buyer account, not the admin.

| #    | Do                                                                                       | Pass when                                                                                                     |
| ---- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 3.1  | Pay with each method: BCEL, LDB, JDB, IB, APB, M-Money, card                              | QR shows on desktop; on a phone the bank app or payment page opens                                            |
| 3.2  | Complete one payment                                                                     | Within ~10 s the ticket appears in Account, with a "Payment confirmed" notification                           |
| 3.3  | Railway logs for 3.2                                                                     | `POST /api/webhook/payment` returned **200**. A **401** means PhaJay's signature format differs from the code: stop and report it |
| 3.4  | Open the payment record in Supabase (`Payment` table)                                     | `state = completed`, `providerTransactionId` filled, amount equals what you paid                             |
| 3.5  | Pay using a coupon                                                                        | Amount charged by PhaJay equals the discounted total shown in checkout                                        |
| 3.6  | Start checkout, do **not** pay, wait 20 minutes                                           | Order becomes `cancelled`; ticket count returns to stock                                                      |
| 3.7  | **Late payment:** start a QR, wait until the 15-minute countdown has ended, then pay       | Customer either gets the ticket or a refund request is created. Known bug today: money is taken, no ticket, no refund. Must be fixed before launch |
| 3.8  | Double-click "Pay", or pay the same order in two tabs                                     | Only one order and one payment exist                                                                          |
| 3.9  | Request a refund as the buyer, approve and execute it as admin, then sync its status      | Refund reaches `succeeded`; order and ticket show `refunded`                                                  |
| 3.10 | Scan the ticket from 3.2 at `/staff-scanner`                                              | First scan: checked in. Second scan: "already checked in". The refunded ticket from 3.9 is rejected            |

If anything fails, write down the time, the order number (starts with `PSK`)
and copy the Railway log lines around that time.

## 4. Sign-off

| Step | Result (pass / fail / skipped) | Notes |
| ---- | ------------------------------ | ----- |
| 1.1  |                                |       |
| 1.2  |                                |       |
| 1.3  |                                |       |
| 2.1  |                                |       |
| 2.2  |                                |       |
| 2.3  |                                |       |
| 2.4  |                                |       |
| 2.5  |                                |       |
| 2.6  |                                |       |
| 2.7  |                                |       |
| 3.1  |                                |       |
| 3.2  |                                |       |
| 3.3  |                                |       |
| 3.4  |                                |       |
| 3.5  |                                |       |
| 3.6  |                                |       |
| 3.7  |                                |       |
| 3.8  |                                |       |
| 3.9  |                                |       |
| 3.10 |                                |       |

Do not switch `PHAJAY_ENVIRONMENT` to `production` until every step passes.
