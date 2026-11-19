# Private media storage — staged rollout

## Current status
- Neon project: `saugaat-staging`; branch: staging main; region: Singapore (`ap-southeast-1`).
- Private S3-compatible bucket: `saugaat-memories-staging` (**private**, not public-read). No user photos uploaded or public media permissions granted during provisioning.
- Storage is available, but end-to-end Saugaat uploads are **not** activated.
- New default-deny flag: `PRIVATE_MEDIA_UPLOADS_ENABLED=false`. The upload-intent API returns HTTP 503 while disabled; owner and guest upload controls are hidden.
- Payment processing remains disabled.

## Presigned upload compatibility — code updated, integration unverified

Saugaat now issues branch-scoped AWS SDK `PutObjectCommand` **presigned PUT** URLs (five-minute expiry) instead of S3 presigned HTML POST policies, matching Neon's documented S3-compatible PUT approach. The browser uploads the binary directly with the exact declared MIME, then the completion endpoint checks S3 HEAD metadata for Content-Type and byte count. The API still denies uploads unless `PRIVATE_MEDIA_UPLOADS_ENABLED=true`.

**Do not turn uploads on yet.** Browser CORS, scoped storage credential, cross-origin failures, malicious-content quarantine/scanning, exact object validation and deletion permissions have not passed live integration testing. A presigned PUT URL is not a substitute for content inspection or a full upload-size security boundary.

## Required checks before activating uploads
1. [x] Update client/server to documented S3 presigned PUT API. [ ] Verify actual PUT and browser CORS behavior on a restricted Neon storage test object.
2. Provision a least-privilege branch-scoped credential. Add `S3_ENDPOINT`, `S3_REGION=ap-southeast-1`, `S3_BUCKET=saugaat-memories-staging`, `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` as *encrypted Preview-only* Vercel environment variables; never commit or paste credentials in chat.
3. Ensure allowed origin exactly matches the intended HTTPS Preview origin. Test cross-origin rejection and signed URL expiry.
4. Verify upload validation using authentic JPEG/PNG/WebP/MP4 magic bytes, size, MIME and content filtering. Implement malware/quarantine handling; extension and client-declared MIME checks alone are insufficient.
5. Verify unauthorized read/write, expired/revoked invitation, upload exhaustion, moderation approval, and deletion including storage cleanup.
6. Run disposable test media, host approval, invite permission and private download checks in staging.
7. Only after the above gates are satisfied, explicitly set `PRIVATE_MEDIA_UPLOADS_ENABLED=true` in Preview. Leave Production disabled until separate security signoff.

## Related unfinished release gates
- Baseline `20261118_init` on real Neon staging using official Prisma CLI (not reapply initial SQL).
- Backup/restore drill, account recovery, request throttling, privacy/legal review, and staging real-user journeys.
- No production deployment or live payment activation.
