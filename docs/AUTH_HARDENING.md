# Saugaat authentication hardening — staged change

## What changed
- Shared PostgreSQL-backed attempt throttling for signup/login, not an instance-local JavaScript Map.
- Fixed 15-minute windows. The per-account-email bucket is HMAC-SHA256 hashed using the server-side session secret, so no raw email/IP is stored in `AuthThrottle`.
- Login: 15 attempts per email and 90 attempts per address per 15 minutes. Signup: 8 attempts per email and 25 attempts per address per 15 minutes.
- The Postgres upsert handles concurrent attempts atomically and counts attempts even if a password is wrong.
- Signup and login actions check throttles before account lookup and return a generic retry message after the limit.
- An additive migration `20261119_auth_throttle` creates only `AuthThrottle` and a `resetAt` index. It does not drop or rewrite existing data.

## Verified deployment — 19 November 2026

- Latest commit `4e98e0f`: GitHub Actions full CI succeeded (verify, migration-baseline-rehearsal, browser-smoke), run `44489556078`.
- Neon temporary migration branch passed additive schema diff, with only `AuthThrottle` table, primary key and index added.
- Owner-approved Neon migration `20261119_auth_throttle` SQL applied to main staging branch. Neon confirms **18 total tables** (16 application tables + `_prisma_migrations` + `AuthThrottle`); User and Event tables remain empty. Recovery branch `saugaat-auth-throttle-recovery-20261119` retained.
- Vercel protected Preview for commit `4e98e0f` at `https://saugaat-9lg7pob1q-akashsahu4252-4042.vercel.app` is READY. Homepage, signup, login, `/api/health/live`, and `/api/health/ready` returned HTTP 200.
- **Important pending history step:** The Neon migration workflow applied SQL outside the Prisma CLI, so `_prisma_migrations` still contains only `20261118_init`. Register the already-executed new migration once with the official Prisma CLI, **not** `migrate deploy`. In a trusted local terminal with the reviewed repository and direct `saugaat_staging` URL already set securely as `DATABASE_URL`:
  1. `npx prisma migrate status` — expect `20261119_auth_throttle` shown as pending.
  2. Verify `AuthThrottle` exists on the correct Neon staging DB (SQL already checked by Neon).
  3. `npx prisma migrate resolve --applied 20261119_auth_throttle` — records history only; does not rerun CREATE TABLE.
  4. `npx prisma migrate status` — expect "Database schema is up to date!".
  5. Remove the `DATABASE_URL` environment variable. **Never** post raw URL, tokens or credentials to GitHub or chat.
- Account creation/login **live-user journey remains unverified on Neon staging** even though CI browser tests passed. No public launch authorized.
- Private media uploads and live payments remain disabled.

## Deployment ordering — critical
1. Confirm GitHub CI is GREEN on the change, including migration-rehearsal, database concurrency test, browser smoke and Next.js build.
2. Back up/branch the **real Neon staging** database; verify the existing initial migration is already recorded.
3. Review the SQL and test `20261119_auth_throttle` in an isolated Neon branch.
4. After owner authorization, run **only the new** reviewed migration with Prisma `migrate deploy` on the direct staging connection. Never run `migrate resolve --applied` on a new migration that hasn't actually been executed.
5. Confirm `public."AuthThrottle"` exists and `public._prisma_migrations` has exactly two successful migrations. Verify no user/event data was changed.
6. **Only then** deploy the corresponding application code to Vercel Preview and test actual login/signup against staging. Do not deploy the new actions before schema migration.
7. Retain production separation and keep payments/uploads disabled.

## Additional security required before release
- IP forwarding headers may be spoofed on untrusted reverse proxies. Use trusted edge WAF/CDN limits and audit forwarded IP configuration.
- A user can deliberately submit a victim's email repeatedly; email-based locks can temporarily delay legitimate users. Consider calibrated per-email+source bucketing, CAPTCHAs, and account recovery UX.
- Implement bounded expiry cleanup for `AuthThrottle` entries and retention monitoring.
- Add password-reset/recovery with verified email provider, account deletion, audit logging and monitoring.
- The limiter is **defense in depth**, not a complete anti-bot system.

This change is NOT yet deployed to staging until all gates above pass.
