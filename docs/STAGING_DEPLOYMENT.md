# Saugaat staging deployment runbook

**Status:** Configuration guide only. A live deployment is NOT yet created. No cloud credentials are included in this repository.

## Required connections
- Vercel: connect the `Akashsahu12211/saugaat` GitHub repository to a new project.
- Neon: create a dedicated PostgreSQL **staging** database, separate from eventual production.
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

## Database release blocker
The repository currently uses `prisma db push` in CI for ephemeral test databases. **Do not use `db push` as the production migration strategy.** Before a durable staging/production database is used:
- Review the Prisma schema for destructive changes and data retention.
- Generate and review the initial migration in development; commit `prisma/migrations` to GitHub.
- Run `prisma migrate deploy` on staging through an explicitly controlled migration step. Do not run migrations simultaneously from multiple serverless function instances.
- Capture backup, restore and rollback procedure, test restore on an isolated instance.

## Staging acceptance checklist
- [ ] Vercel project linked, HTTPS URL created
- [ ] Neon database provisioned, secrets configured securely
- [ ] Reviewed Prisma migrations applied with no schema drift
- [ ] `/api/health/live` gives 200 and `/api/health/ready` gives 200
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
