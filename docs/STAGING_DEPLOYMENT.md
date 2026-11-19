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

## Prisma baseline — important staging release blocker

The first schema migration in `prisma/migrations/20261118_init/migration.sql` was **already applied** to Neon `saugaat_staging` via the isolated Neon migration workflow. It created 16 application tables, 11 enums and 25 foreign keys. **Do NOT run `prisma migrate deploy` on this existing schema until history is baselined**, because `_prisma_migrations` is currently absent.

The CI pipeline now runs `prisma migrate deploy` and `prisma migrate status` against fresh throwaway PostgreSQL databases. A separate `migration-baseline-rehearsal` CI job tests the official baseline procedure against a simulated preexisting schema:
1. On ephemeral PostgreSQL only: `npx prisma db push` creates the current schema without migration history.
2. `npx prisma migrate resolve --applied 20261118_init` adds migration history **without replaying the SQL**.
3. `npx prisma migrate status` verifies there is no pending migration.
4. SQL assertions confirm exactly one successful migration history record.

To complete the **real staging baseline**, first review successful CI results, take a Neon recovery point/branch and test restore, compare the deployed schema with the committed migration, then execute the **official Prisma CLI** `npx prisma migrate resolve --applied 20261118_init` using the **direct** Neon staging connection from a private, authorized environment. Follow with `npx prisma migrate status`. Never echo a connection string into CI logs, source code, or chat. This is deliberately a separate controlled operation and is **not automatically done on the production database**.

## Staging baseline execution — owner-run step

**Verified on 19 November 2026:** Neon `saugaat_staging` has 16 application tables and **no** `_prisma_migrations` table. A dedicated recovery branch `saugaat-baseline-recovery-20261119` was created before attempting this step. The command `npx prisma migrate status` correctly identified `20261118_init` as not recorded. The attempted secure remote write was blocked and **no baseline write occurred**.

**Run only in a trusted local terminal (not inside chat), with a direct Neon connection to staging:**

1. Clone `https://github.com/Akashsahu12211/saugaat` and check out the reviewed migration commit; run `npm install`.
2. In the Neon console, choose project `saugaat-staging`, main branch, database `saugaat_staging`, and copy the **direct** PostgreSQL URL (hostname must not contain `-pooler`). Keep it out of GitHub, terminal history and chat. Assign the value privately as `DATABASE_URL` using your terminal's secure environment handling.
3. Run `npx prisma migrate status` and confirm it says migration `20261118_init` is pending while the 16 tables already exist. **Do not run `migrate deploy` first**.
4. Run `npx prisma migrate resolve --applied 20261118_init` exactly once. This records the existing schema in Prisma migration history without replaying the table-creation SQL.
5. Run `npx prisma migrate status`. Expected: database schema is up to date. Confirm `_prisma_migrations` has exactly one row for `20261118_init` with `finished_at` not null.
6. If the command fails, **do not** rerun the initial migration or edit the migration history table manually; capture only the sanitized error text and review. Keep the recovery branch until schema and backup restore checks are complete.

The official procedure has been rehearsed in CI on a disposable PostgreSQL database. The *real staging* history remains pending until the owner executes the step and the result is checked.

## Verified staging environment

- [x] Vercel protected Preview build READY (commit `40c5653`).
- [x] Neon connection and PostgreSQL readiness endpoint HTTP 200.
- [x] `/api/health/live` HTTP 200; homepage, login and signup pages loaded.
- [x] Guest invitation redirect stays same-origin; the fix passed browser CI.
- [x] Automated desktop/mobile/tablet Chromium journeys for signup → event creation and invitation → RSVP → gift reservation passed (**21/21 Playwright tests**).
- [ ] Official Prisma migration baseline in live Neon staging.
- [ ] Full authenticated E2E browser journey on Neon staging, isolated QA identities only.
- [ ] Private object storage, malware scan/quarantine, media deletion and account recovery tests.
- [ ] Backup restore drill, request throttling, privacy notice and security review.
- [ ] Production deploy; live payments disabled.

## Staging acceptance checklist
- [x] Vercel project linked, protected Preview HTTPS URL created
- [x] Neon database provisioned, Preview secrets configured securely
- [ ] Schema applied, pending official Prisma migration-history baseline and drift verification
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
