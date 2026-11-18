# Milestone 5 — Private Shared Memories (code implementation)

## Delivered source
- Private S3-compatible storage upload policy: allowlisted JPG, PNG, WebP (12 MB) and MP4 (50 MB), expiring in 5 minutes.
- Uploads use direct browser-to-storage presigned POST: no file payload through the Next.js server.
- File size/type checked before signing **and** verified with S3 HeadObject before recording a completed upload. These controls are not a replacement for antivirus or actual file-signature inspection.
- Every upload begins **PENDING** and requires event-owner approval before invited gallery visitors can view it.
- Event-owner moderation (approve, reject, delete), including private object deletion.
- 60-second private download links, minted only after session/invitation authorization and approval checks, with no-store headers.
- Host can issue an invite with separate media view/upload access. Both default off. Revoking the invitation immediately stops new gallery link issuance.
- Albums are labelled collections through the validated `album` field; future migration can add dedicated album ownership and permission records.
- Existing host event and guest registry pages now include upload and gallery sections.

## Local setup
Set `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION` in `.env`. Keep the bucket private, disable public ACL policies, enable server-side encryption and apply a CORS rule permitting POST only from `NEXT_PUBLIC_SITE_URL`. Run `npm install`, `npm run db:generate`, `npx prisma migrate dev --name private-memories` and `npm run dev`.

## Important acceptance blockers
- Storage credentials were not supplied, so no actual upload/download round-trip against a real object store has been executed.
- A complete `npm install`, Prisma generation, `tsc --noEmit`, Next.js build and browser flows are pending CI. The local development sandbox cannot reach the npm registry.
- Production still needs AV scanning, image/video signature checks, thumbnail generation, EXIF stripping, quota/billing hard limits, data retention/orphan cleanup, content abuse report workflow, optional per-album finer permissions, and legal/privacy review before real user media.
- A revoked invite does **not** revoke already-issued short-lived object-store URLs; URL lifetime is at most 60 seconds.
- Retained rejected blobs should be deleted after a retention period; abandoned upload intents likewise require scheduled cleanup.
- Other people’s images should be uploaded only with their permission; do not use real user photos for tests.

## Verification
`npm test` runs source contract tests for default-deny access, object checks, moderation, and private URLs. Contract tests do not establish production security.
