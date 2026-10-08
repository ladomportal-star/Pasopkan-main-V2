# Supabase media rollout

## Implemented

The frontend API client uploads PNG/JPEG/WebP data URLs in known image fields through authenticated POST /api/media before saving forms. Avatars use private-media; event images use listing-media. Database records retain storage:// references, with separate display URLs in frontend memory. Event edit round trips restore the reference instead of persisting a URL. Private avatar links refresh every four minutes while the session is active.

Backend validation checks image size/type signatures, reference ownership and bucket visibility. Private URL resolution is owner-only. No storage service-role key is exposed to the browser. Image header checks do not replace malware scanning or full image decoding; add those before accepting untrusted document formats.

## Selected-project status (2026-10-08)

The reviewed `backend/supabase/storage.sql` was applied to the selected Supabase project. Read-back confirmed `listing-media` is public, `private-media` is private, and `pasopkan_backend_media_only` protects object operations. The live browser and cross-account checks below are still required.

## Remaining operator verification

1. Configure matching production backend Supabase variables securely and verify a real Google session.
2. Confirm bucket size/type restrictions in the dashboard.
3. Upload a profile image and event cover/gallery image through the real forms. Reload and edit without replacing the image; verify database values remain storage:// references.
4. Test with a second account: foreign private references and direct object reads/writes must fail. Confirm public listing downloads work without a session.
5. Wait beyond five minutes and confirm avatar URL refresh. Confirm failed uploads surface an error and do not report a saved profile.
6. Inventory legacy media separately before any transfer. No existing cloud bucket/data is deleted and no legacy image migration has been executed.

An upload can succeed before its parent form save fails. These orphan objects need a future age-based cleanup job that checks database references before deletion. Do not delete objects merely because one save request failed.

Public listing images are deliberately public; never put identity documents there. This follows Supabase's [bucket visibility model](https://supabase.com/docs/guides/storage/buckets/fundamentals) and [server-side access guidance](https://supabase.com/docs/guides/storage/security/access-control).

## Verification boundaries

Local tests verify field selection, upload failure propagation, ownership/visibility rejection and event reference round trips. SQL read-back proves bucket/policy provisioning, but does not prove successful browser uploads or cross-account isolation. Browser end-to-end and cross-account live Storage acceptance remain required before deployment.
