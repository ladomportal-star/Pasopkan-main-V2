# Wenova SMS OTP — backend-only rollout

The frontend asks Supabase Auth to send and verify OTPs. Supabase creates and checks the OTP; this backend endpoint only delivers the SMS via Wenova. **Do not call Wenova from the browser or store an OTP in Prisma.** The hook replaces Supabase's built-in SMS provider. This setup applies to both phone sign-in and the Organizer phone-change flow.

## 1. Confirm the Wenova account

In Wenova Dashboard, confirm account identity verification, an active SMS package, an API Token in **Key**, and the permitted SMS sender/header (for example `WNV-OTP` only if Wenova has approved it). The 500-SMS package shown in the dashboard is capacity, not proof of a working API connection. Use `usePackage: true`; do not configure wallet billing for this integration. Never paste the API Token into Git, a ticket, chat, or a `VITE_*` variable.

## 2. Deploy this backend first

Deploy the committed Prisma migration (`npm run db:migrate`) and backend code before enabling the hook. The HTTPS endpoint is `POST https://api.pasopkan.la/api/auth-hooks/send-sms` if that is the current API host. It accepts only a signed Standard Webhooks JSON request; opening it in a browser is not a valid test. The route must be reachable publicly from Supabase Auth. Keep HTTPS/TLS enabled.

Set these **backend deployment secrets** (Railway Variables or equivalent):

| Variable                        | Value                                                                                         |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| `SUPABASE_SEND_SMS_HOOK_SECRET` | Signing secret generated/shown by the Supabase Send SMS HTTP Hook, format `v1,whsec_<base64>` |
| `WENOVA_SMS_TOKEN`              | API Token from Wenova Dashboard → Key; use this **or** `WENOVA_SMS_SCRIPT_ID`                 |
| `WENOVA_SMS_SCRIPT_ID`          | Optional positive integer Script ID if not using a Token                                      |
| `WENOVA_SMS_HEADER`             | Wenova-approved sender/header, e.g. `WNV-OTP` if approved                                     |
| `WENOVA_SMS_API_URL`            | `https://apimicroservices.wenova.fun/sms/package`                                             |

Set only one Wenova credential if possible. The backend uses the Token when both are present. Restart/redeploy after changing secrets. Do not print secrets in deployment logs. The code makes a direct server-to-server HTTPS request, so **no frontend package or `wenova-link` SDK is needed**.

## 3. Enable the Supabase Auth hook

In the _same_ Supabase project that the frontend uses:

1. `Authentication → Providers → Phone`: enable Phone Auth and keep automatic phone confirmation **off**, so Supabase generates a real OTP.
2. `Authentication → Hooks → Send SMS`: choose **HTTP** and set the backend endpoint URL above.
3. Copy the hook signing secret into `SUPABASE_SEND_SMS_HOOK_SECRET` on the backend and redeploy the backend. Verify the URL and secret match before enabling the hook.
4. Enable the Send SMS hook. Do not also set up Twilio for this route. Leave the hook disabled if backend migration, HTTPS reachability, or secrets are incomplete.

The hook receives `sms.otp` and (in current Supabase Auth) `sms.phone`. On phone changes, `sms.phone` is the intended new number while `user.phone` may still be the old number. The backend uses `sms.phone` first. It accepts Lao E.164 `+85620XXXXXXXX`, converts it to Wenova `20XXXXXXXX`, and sends a short English message to consume fewer SMS segments.

## 4. Verify end to end with one real number

Use a test account and Lao mobile number that you control. Click **Create Event**, enter the number, request OTP, receive the SMS, and enter the code. Confirm Supabase verifies the number and the Organizer application flow continues. Check Wenova package usage increases by one. Also test an invalid OTP and a resend after the cooldown.

The hook checks the raw-body signature and 5-minute timestamp window, rejects malformed or non-Lao numbers, and stores only the webhook ID and a keyed HMAC digest of the body for idempotency. It never stores or logs OTP, phone, or API Token. A second signed delivery of an already-successful webhook returns success without sending another SMS. A timeout/ambiguous gateway response stays `pending` to avoid a second paid SMS; inspect Wenova/Supabase logs before manually resolving such a row. The backend only considers Wenova `data.resultCode = 20000` a confirmed gateway acceptance. That is **not** proof the handset received the message.

No live SMS is sent by the automated test suite. Do not enable the production hook until one controlled end-to-end test succeeds.
