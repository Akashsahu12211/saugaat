# Saugaat staging deployment runbook

**Status:** Vercel protected Preview deployment is READY and Neon staging database is provisioned. No production release has happened. No credentials are included in this repository.

## Required connections
- Vercel: `Akashsahu12211/saugaat` GitHub repository is linked to project `saugaat`; protected Preview is deployed.
- Neon: project `saugaat-staging`, database `saugaat_staging` (Singapore), with 16 application tables.
- Later: private S3-compatible storage for guest memories. Keep real uploads disabled until bucket, malware scanning and deletion controls are tested.
- Keep `PAYMENTS_MODE=disabled` until Indian payment-provider onboarding, refunds and compliance reviews are complete.

## Before clicking Deploy
1. Verify latest `main` GitHub Actions jobs are green.
2. Create a strong random `SESSION_SECRET` (at least 32 unpredictable characters). Store it only in Vercel's encrypted environment settings.
3. Configure `DATABASE_URL` using Neon-provided TLS-enabled connection string. Do not paste it into chat, GitHub issues or source.
4. Set `NEXT_PUBLIC_SITE_URL` to the **actual, trusted HTTPS deployment origin**. The value must match the deployed domain. Since this is a build-time `NEXT_PUBLIC_` variable, redeploy if changed.
5. Set `PAYMENTS_MODE=disabled` and `REQUIRE_PRIVATE_MEDIA_STORAGE=false` for staging without uploads. Never test real customer photos until private storage is configured.
6. Use the appropriate deployment environment scopes; preview and production credentials must be separate.
7. Check `npm run preflight:production` from a protected environment. This checks configuration but not service connectivity.

## Prisma migration-history baseline — COMPLETE

**Verified 19 November 2026:** The owner ran `npx prisma migrate resolve --applied 20261118_init` with a direct Neon staging connection and then `npx prisma migrate status`. CLI returned `Migration 20261118_init marked as applied.` followed by `Database schema is up to date!`. An independent Neon SQL query confirmed exactly one applied `20261118_init` record in `public._prisma_migrations` (not rolled back) and 16 existing application tables. The direct database environment variable was removed from the owner's local PowerShell session.

Do not rerun `migrate resolve` for this already-applied migration. Use reviewed `prisma migrate deploy` for **future new migrations only**, after schema review, recovery backup and staging testing. Never use `prisma db push` on persistent staging or production.

Recovery branch `saugaat-baseline-recovery-20261119` is retained as a pre-baseline snapshot; a **separate tested restore drill is still required**.

## Verified staging environment

- [x] Vercel protected Preview build READY (commit `40c5653`).
- [x] Neon connection and PostgreSQL readiness endpoint HTTP 200.
- [x] `/api/health/live` HTTP 200; homepage, login and signup pages loaded.
- [x] Guest invitation redirect stays same-origin; the fix passed browser CI.
- [x] Automated desktop/mobile/tablet Chromium journeys for signup → event creation and invitation → RSVP → gift reservation passed (**21/21 Playwright tests**).
- [x] Official Prisma migration baseline in live Neon staging; independently verified.
- [ ] Full authenticated E2E browser journey on Neon staging, isolated QA identities only.
- [ ] Private object storage, malware scan/quarantine, media deletion and account recovery tests.
- [ ] Backup restore drill, request throttling, privacy notice and security review.
- [ ] Production deploy; live payments disabled.

## Staging acceptance checklist
- [x] Vercel project linked, protected Preview HTTPS URL created
- [x] Neon database provisioned, Preview secrets configured securely
- [x] Schema applied and Prisma migration history baselined; separate detailed drift/restore review remains pending
- [x] `/api/health/live` gives 200 and `/api/health/ready` gives 200
- [ ] Sign up, log in, create and publish an event
- [ ] Invite + revoke guest, verify denied access after revocation
- [ ] Guest RSVP and quantity-1 gift reservation race tests on PostgreSQL
- [ ] Co-host access permissions and admin role isolation
- [ ] Browser smoke on Android Chrome, iOS Safari and desktop
- [ ] Error tracking, throttling, account recovery and backups verified
- [ ] Privacy policy, deletion flow and user consent approved before public onboarding
- [ ] Payments disabled and storage upload functionality restricted until cloud verification

## What counts as done
A passing CI build does **not** establish a public site. Staging is complete only after a real HTTPS URL is observed and its core flows tested against the managed database. Production launch requires further security and privacy acceptance checks.

## Service-account safety
Only the repository owner may authorize third-party integrations and service billing. Never expose raw database passwords, private-media tokens or provider keys in this repository or ChatGPT messages.
