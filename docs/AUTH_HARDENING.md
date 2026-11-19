# Saugaat authentication hardening — staged change

## What changed
- Shared PostgreSQL-backed attempt throttling for signup/login, not an instance-local JavaScript Map.
- Fixed 15-minute windows. The per-account-email bucket is HMAC-SHA256 hashed using the server-side session secret, so no raw email/IP is stored in `AuthThrottle`.
- Login: 15 attempts per email and 90 attempts per address per 15 minutes. Signup: 8 attempts per email and 25 attempts per address per 15 minutes.
- The Postgres upsert handles concurrent attempts atomically and counts attempts even if a password is wrong.
- Signup and login actions check throttles before account lookup and return a generic retry message after the limit.
- An additive migration `20261119_auth_throttle` creates only `AuthThrottle` and a `resetAt` index. It does not drop or rewrite existing data.

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
