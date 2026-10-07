# Phone OTP rollout

The application supports Lao mobile sign-in through the backend endpoints
`POST /api/otp/send` and `POST /api/otp/verify`. Supabase Auth owns OTP creation,
expiry, verification, and session issuance. The frontend never receives the SMS
provider credential.

## 1. Configure the backend

Add these values to `Backend/.env` (never commit the real keys):

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<sb_publishable_... or legacy anon key>
```

`SUPABASE_SERVICE_ROLE_KEY` remains separate. It is not used for public OTP
requests.

## 2. Enable phone authentication

In Supabase Dashboard, open **Authentication > Providers > Phone**, enable phone
sign-in, then set the OTP expiry and request interval. The UI expects a six-digit
OTP and allows another send after 60 seconds, so keep the Supabase settings in
sync with those values.

## 3. Connect SMS delivery

Choose one of these deployment paths:

1. Configure a Supabase-supported SMS provider in the dashboard.
2. For the planned regional provider API, configure a Supabase **Send SMS Hook**.
   The hook receives the OTP from Supabase and sends it through that provider.

Keep the provider API secret in the hook environment, not in the frontend or
Pasopkan database. Validate the hook signature, use HTTPS, set a short timeout,
and avoid logging the OTP or full phone number.

Official references:

- <https://supabase.com/docs/reference/javascript/auth-signinwithotp>
- <https://supabase.com/docs/reference/javascript/auth-verifyotp>
- <https://supabase.com/docs/guides/auth/auth-hooks/send-sms-hook>

## 4. Deploy and verify

1. Deploy the backend with the two Auth variables above.
2. Restart the backend and confirm there is no phone OTP configuration warning.
3. Open `/login`, select **Phone**, and use a real Lao mobile number.
4. Confirm the SMS arrives without the OTP appearing in server, hook, or browser logs.
5. Enter a wrong OTP and confirm it is rejected with a generic message.
6. Enter the correct OTP and confirm `/api/account/sync` creates the Prisma user.
7. Create a free test-ticket order and confirm it belongs to that user's `authId`.
8. Confirm a sixth OTP request from one IP inside ten minutes is rate-limited.

## Security behavior

- Only Lao mobile numbers matching `+85620XXXXXXXX` are accepted.
- Send requests are limited to 5 per IP per 10 minutes.
- Verify requests are limited to 10 per IP per 10 minutes.
- OTP verification responses use `Cache-Control: no-store`.
- Provider errors are converted to generic client messages.
- Access and refresh tokens are returned only after Supabase verifies the OTP.

For a production system behind multiple proxies, keep Express `trust proxy`
aligned with the real load-balancer topology so IP-based limits cannot be bypassed.
