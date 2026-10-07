# Supabase media rollout

## Implemented

The frontend API client uploads PNG/JPEG/WebP data URLs in known image fields through authenticated POST /api/media before saving forms. Avatars use private-media; event images use listing-media. Database records retain storage:// references, with separate display URLs in frontend memory. Event edit round trips restore the reference instead of persisting a URL. Private avatar links refresh every four minutes while the session is active.

Backend validation checks image size/type signatures, reference ownership and bucket visibility. Private URL resolution is owner-only. No storage service-role key is exposed to the browser. Image header checks do not replace malware scanning or full image decoding; add those before accepting untrusted document formats.

## Operator steps — not performed automatically

1. Choose the intended test Supabase project, configure matching backend SUPABASE_URL and service-role secret securely, and verify a real Google session.
2. Review backend/supabase/storage.sql and the project's existing storage policies. Run it against that project only. It provisions the two buckets and blocks browser object operations in them; the backend service role performs uploads/signing. It refuses to silently change conflicting bucket visibility.
3. Confirm bucket size/type restrictions in the dashboard, especially if the buckets already existed.
4. Upload a profile image and event cover/gallery image through the real forms. Reload and edit without replacing the image; verify database values remain storage:// references.
5. Test with a second account: foreign private references and direct object reads/writes must fail. Confirm public listing downloads work without a session.
6. Wait beyond five minutes and confirm avatar URL refresh. Confirm failed uploads surface an error and do not report a saved profile.
7. Inventory legacy media separately before any transfer. No existing cloud bucket/data is deleted and no legacy image migration has been executed.

An upload can succeed before its parent form save fails. These orphan objects need a future age-based cleanup job that checks database references before deletion. Do not delete objects merely because one save request failed.

Public listing images are deliberately public; never put identity documents there. This follows Supabase's [bucket visibility model](https://supabase.com/docs/guides/storage/buckets/fundamentals) and [server-side access guidance](https://supabase.com/docs/guides/storage/security/access-control).

## Verification boundaries

Local tests verify field selection, upload failure propagation, ownership/visibility rejection and event reference round trips. They do not prove that a live Supabase project has been configured correctly. Browser end-to-end and cross-account live Storage acceptance remain required before deployment.
