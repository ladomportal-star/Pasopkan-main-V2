# Shared web and app accounts

Pasopkan uses the Supabase Auth user UUID (`auth.users.id`) as the canonical account identity. The backend `User.authId` and all user-owned records must continue to reference that UUID. Do not merge accounts by matching editable profile email/phone fields.

## Client configuration

The web client, every mobile client, and the backend must use the same Supabase project:

- Web: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (publishable key is also accepted by Supabase clients).
- Mobile: that project's Supabase URL and publishable/anon key.
- Backend: `SUPABASE_URL` and its matching publishable key for Auth operations, plus the secret/service-role key for privileged server-only operations.

Never put a Supabase secret/service-role key in a browser or mobile app. If clients point at different projects, their user UUIDs cannot be shared, even when the visible email or phone is the same.

## Link sign-in methods

Users should sign in to the account they want to keep, open Edit Profile → Sign-in methods, then link Google or verify the phone number. Supabase verifies the new phone and attaches it to the signed-in Auth user; the backend stores phone/email only from the signed access token. That keeps the same Auth UUID and therefore the same profile across clients.

For Google linking, enable **Manual Identity Linking** in Supabase Auth settings and allow the web redirect URL (`/edit-profile`) and the corresponding mobile deep link in the project's redirect URL allow-list. The app must use Supabase's `linkIdentity` API while signed into the account to keep. Keep login and linking on the same Supabase project.

## Existing duplicate accounts

If a phone or Google identity is already attached to another Auth user, linking must fail and the application must not silently combine the accounts. Historical orders, tickets, organizer ownership, payouts, and audit records may be attached to either UUID. Recover/merge such accounts only through a separately reviewed migration that verifies control of both identities, defines ownership for every dependent record, and is backed up and audited. Until then, ask the user to sign in using the account that owns their records and link any still-unclaimed identity there.

## Verification

After linking, sign out and sign in from the other client with either linked method. Confirm the Supabase Auth UUID is unchanged and the backend returns the same `publicId`/profile. Never test account linking against production without a dedicated test user and an approved SMS setup.
