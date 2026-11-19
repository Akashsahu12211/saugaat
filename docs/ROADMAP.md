# Saugaat engineering roadmap — verified status (19 Nov 2026)

## Status definitions
- **Implemented** means the relevant application code exists.
- **CI passed** means a GitHub Actions job validated fresh PostgreSQL migrations, automated tests, typecheck, build and/or browser flows. It does not certify cloud security, payments, media storage or launch readiness.
- **Staging ready** means a protected Preview deployment is READY and health endpoints have returned HTTP 200. This is not a public production launch.

| Milestone | Scope | Code status | Remaining release gate |
| --- | --- | --- | --- |
| M1 | Signup, login, host dashboard, event creation | Implemented; CI tested | Password reset, rate limiting, account removal, managed-staging real browser tests |
| M2 | Guest registry, RSVP, gift reservations | Implemented; CI browser tested | Managed-staging reservation concurrency and abuse tests |
| M3 | Co-hosts and gift tracking | Implemented | Cross-event role/permission and purchase-state tests |
| M4 | WhatsApp share links, QR and revocable invitations | Implemented; invite flow CI tested | Staging revocation/expiry and misuse tests |
| M5 | Private Shared Memories and moderation | Implemented with uploads safety-disabled | Neon private bucket credential wiring, signed upload compatibility, CORS, quarantine/malware scans, deletion and guest-access QA |
| M6 | Group gifting | Pledge bookkeeping implemented, no real payment collection | Provider onboarding, payment reconciliation, refund/dispute operations, financial/legal compliance |
| M7 | Admin reports and moderation | Implemented | Admin provisioning, audit logging and abuse handling in staging |
| M8 | CI, preflight and protected staging preview | Implemented; CI passed, Preview READY | Finish actual migration-history baseline, backup restore drill, operational security, real staging acceptance and launch gate |

## Cloud state
- Vercel project `saugaat` exists with protected Preview deployments. Preview URL: `https://saugaat-759wdfexn-akashsahu4252-4042.vercel.app`. Do not confuse this with production.
- Neon project `saugaat-staging` has database `saugaat_staging` (Singapore). Initial SQL applied with 16 application tables, 11 enums and 25 foreign-key relationships.
- **Critical:** Prisma `_prisma_migrations` history has **not** been baselined on the real staging database. The official `migrate resolve --applied 20261118_init` procedure passed in isolated CI but a protected remote write attempt was blocked. See `docs/STAGING_DEPLOYMENT.md` for owner-run steps. Do not run `migrate deploy` against the existing tables before baseline.
- Recovery branch `saugaat-baseline-recovery-20261119` exists. This is not a verified backup-restoration drill.
- Private Neon Storage bucket `saugaat-memories-staging` exists but **upload system is disabled** by `PRIVATE_MEDIA_UPLOADS_ENABLED=false`, including API fail-closed checks.
- Latest known completed CI run on commit `187fb776` passed; future commits require fresh CI verification.
- Live payments remain disabled.

## Launch gates (must pass before public release)
- [ ] Record and verify Prisma migration baseline in **existing** Neon staging database.
- [ ] Compare schema with migration, rehearse backup restore in an isolated Neon branch.
- [ ] Configure private storage credential and test safe media upload, verification, moderation, download, deletion and revocation. Keep uploads disabled until finished.
- [ ] Implement and test password reset, authentication/abuse rate limits, privacy notice and account/data deletion.
- [ ] Verify cross-event permissions, admin audit logs, guest-invite revocation and reservation concurrency on managed PostgreSQL.
- [ ] Run full authenticated end-to-end tests on Neon staging plus manual Android Chrome/iOS Safari accessibility checks.
- [ ] Set monitoring/alerts, incident playbook, backup owner and recovery procedure.
- [ ] Separate production environment/database/secrets from staging. Gate production promotions behind passing checks.
- [ ] Complete privacy/consent/legal reviews before inviting real users.
- [ ] Separately review payment-provider onboarding, merchant terms and refunds before ever enabling actual money collection. A useful registry beta can launch with payments disabled and pledges clearly labeled.

## Detailed docs
- [Staging deployment and Prisma owner-run baseline](STAGING_DEPLOYMENT.md)
- [Private media storage roll-out](PRIVATE_MEDIA_STORAGE.md)
- [Milestone 8 release gates](MILESTONE_8.md)
