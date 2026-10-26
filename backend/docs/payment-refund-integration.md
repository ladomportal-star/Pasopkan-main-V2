# Payment gateway and refund integration

## Current status

The PhaJay adapter supports Payment Link checkout, signed payment webhooks,
transaction lookup, full-transaction refund submission and refund status sync.
It registers only when all required server credentials are present. With missing
credentials the API fails closed and paid checkout remains unavailable.

Refund approval and money movement are separate admin actions. Approval records
the decision in the database. `POST /api/admin/refunds/:id/execute` submits one
approved refund to PhaJay; `POST /api/admin/refunds/:id/sync` reconciles its
provider status. Batch approval never moves money. PhaJay's documented API
accepts a transaction ID and does not expose a partial amount, so provider
execution rejects partial refunds.

PhaJay payout is not a public transfer API in the current documentation. Use
`PHAJAY_PAYOUT_MODE=split_payment` only after the parent/sub-account relationship
and split percent have been configured in PhaJay Portal. In that mode the API
blocks manual payout-bill completion to prevent paying an organizer twice.

## Backend boundaries already prepared

- `PaymentProvider` is the server-side contract for hosted checkout, signed
  webhook verification, transaction checks and refunds. The PhaJay
  implementation is registered at startup when `PAYMENT_PROVIDER=phajay` and
  the required credentials are complete.
- Payment webhook routes run before JSON parsing, retain the original request
  bytes, require JSON, and cap the request body at 64 KiB.
- Payment secrets are parsed only by backend environment configuration. The
  admin readiness endpoint reports booleans/provider ID only and never returns
  credentials.
- If provider configuration or the adapter is missing, payment operations fail
  closed with `503`.

## Configuration

Set these only in `Backend/.env` locally and Railway service variables in hosted
environments:

```dotenv
PAYMENT_PROVIDER=phajay
PAYMENT_API_BASE_URL=https://payment-gateway.phajay.co
PAYMENT_API_KEY=<PhaJay test key or production secret key>
# Optional override during key rotation; otherwise PAYMENT_API_KEY is used.
PAYMENT_WEBHOOK_SECRET=
PHAJAY_ENVIRONMENT=sandbox
PHAJAY_PAYOUT_MODE=manual
```

Use `PHAJAY_ENVIRONMENT=production` only after KYC and production verification.
Use `PHAJAY_PAYOUT_MODE=split_payment` only after PhaJay Portal is configured for
approved organizer sub-accounts. `PAYMENT_MERCHANT_ID` remains available for
other providers but is not required by the documented PhaJay endpoints.

Configure the public webhook URL in PhaJay Portal as:

```text
https://<backend-domain>/api/payment/webhook
```

Also configure the customer success and cancel URLs in PhaJay Portal. Sandbox
Payment Links use PhaJay's test endpoint and must be completed with the PhaJay
Sandbox App.

Before production activation, confirm the following with PhaJay:

1. Official API documentation and sandbox base URL/account.
2. API credential rotation process and any required network/IP allowlisting.
3. Checkout creation and server-side transaction inquiry APIs, including
   required merchant reference, amount units, currency, and return URL rules.
4. Webhook signature algorithm, exact signed bytes/canonicalization, timestamp
   tolerance, key rotation behavior, retry policy, and sample success/failure
   payloads with headers.
5. Refund API, full-refund rules, idempotency support, asynchronous statuses,
   cancellation/timeout semantics, and reconciliation/reporting APIs.
6. Sandbox test cases for duplicate, delayed, out-of-order, invalid-signature,
   wrong-amount, expired-order, partial-refund, and timeout outcomes.

Never send live credentials in chat, source control, frontend variables, logs,
or screenshots. Configure them only in local backend `.env` for sandbox work;
use the deployment platform's secret variables for production.

## Required implementation and release gates

1. Create a pending payment row with a stable idempotency key before calling the
   gateway. Use the server-calculated order total; never trust a client amount.
2. Verify webhook signature over raw bytes, timestamp/replay protection, event
   identity, merchant reference, transaction ID, exact amount and currency.
   For ambiguous callbacks, query the provider from the backend before
   confirming the order.
3. In one database transaction, lock payment/order rows, enforce legal state
   transitions, deduplicate provider event/transaction IDs, and only then mark
   the order paid and issue tickets. A duplicate callback must be harmless.
4. Execute approved refunds through a durable worker/outbox with a stable
   provider idempotency key. Record provider refund ID, retries and sanitized
   failure state; reconcile uncertain outcomes before retrying. Only mark a
   refund succeeded from a verified provider result.
5. Keep payout/refund authorization separate from customer input. Enforce
   remaining refundable amount under a database lock and audit every decision.
6. Run sandbox end-to-end tests, verify duplicate/retry behavior, review logs
   for secret/PII leakage, and obtain business approval before enabling the
   provider in production.

`PAYMENT_API_KEY` and the optional `PAYMENT_WEBHOOK_SECRET` override are
backend-only. Never expose them through Vite variables or React components.
PhaJay uses the same `devSecretKey`/`secretKey` for API authentication and
webhook HMAC signing; the separate override exists only for a controlled
rotation window. Filling the required variables registers the adapter at API
startup; production activation still requires sandbox end-to-end verification
and correct PhaJay Portal callback configuration.
