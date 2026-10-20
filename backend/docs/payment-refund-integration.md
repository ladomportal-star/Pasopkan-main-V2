# Payment gateway and refund integration

## Current status

Paid checkout and provider refunds are intentionally disabled. The API currently
rejects paid ticket checkout; the payment webhook returns `503` until a
provider-specific adapter is implemented. Approving a refund records an
administrative decision in the database; it does **not** transfer money. Do not
enable paid events or tell customers that a refund is complete based on an
approval alone.

This is deliberate: gateway request formats, signing rules, settlement states,
and refund semantics differ. A generic HTTP call without those rules can accept
forged payments or issue duplicate refunds.

## Backend boundaries already prepared

- `PaymentProvider` is the server-side contract for hosted checkout, signed
  webhook verification, and refunds. A provider implementation must be
  explicitly registered at startup and match `PAYMENT_PROVIDER`.
- Payment webhook routes run before JSON parsing, retain the original request
  bytes, require JSON, and cap the request body at 64 KiB.
- Payment secrets are parsed only by backend environment configuration. The
  admin readiness endpoint reports booleans/provider ID only and never returns
  credentials.
- If provider configuration or the adapter is missing, payment operations fail
  closed with `503`.

## When provider access is available

Obtain the following from the payment provider before implementing an adapter:

1. Official API documentation and sandbox base URL/account.
2. Merchant ID, API credential format, key rotation process, and required
   network/IP allowlisting.
3. Checkout creation and server-side transaction inquiry APIs, including
   required merchant reference, amount units, currency, and return URL rules.
4. Webhook signature algorithm, exact signed bytes/canonicalization, timestamp
   tolerance, key rotation behavior, retry policy, and sample success/failure
   payloads with headers.
5. Refund API, partial-refund rules, idempotency support, asynchronous statuses,
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

`PAYMENT_PROVIDER`, `PAYMENT_API_BASE_URL`, `PAYMENT_API_KEY`,
`PAYMENT_MERCHANT_ID`, and `PAYMENT_WEBHOOK_SECRET` are reserved backend-only
configuration keys. Filling them in does not activate payments: an audited,
provider-specific implementation and the release gates above are still
required.
