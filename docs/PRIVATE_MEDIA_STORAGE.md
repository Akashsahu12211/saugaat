# Private media storage — staged rollout

## Current status
- Neon project: `saugaat-staging`; branch: staging main; region: Singapore (`ap-southeast-1`).
- Private S3-compatible bucket: `saugaat-memories-staging` (**private**, not public-read). No user photos uploaded or public media permissions granted during provisioning.
- Storage is available, but end-to-end Saugaat uploads are **not** activated.
- New default-deny flag: `PRIVATE_MEDIA_UPLOADS_ENABLED=false`. The upload-intent API returns HTTP 503 while disabled; owner and guest upload controls are hidden.
- Payment processing remains disabled.

## Integration blocker
Saugaat's current private-media implementation uses AWS SDK `createPresignedPost` and direct HTML multipart POST uploads. Neon Storage documents S3-compatible signed PUT via `PutObjectCommand` and `getSignedUrl`, but **multipart POST policy compatibility has not been verified**. Do not enable the flag just because an S3 bucket exists.

## Required checks before activating uploads
1. Confirm the exact supported presign method and CORS behavior for the currently deployed Neon Storage version; adapt Saugaat client and server if presigned PUT is required.
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
