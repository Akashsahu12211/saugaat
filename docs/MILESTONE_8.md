# Milestone 8 — Beta hardening and deployment readiness

## Delivered as code
- Production/development environment preflight scripts: `npm run preflight`, `npm run preflight:production`.
- Liveness `/api/health/live` and PostgreSQL readiness `/api/health/ready` endpoints.
- Security headers that block framing/object embedding and leak-safe health responses.
- Playwright browser smoke coverage of 375 / 768 / 1440px viewports, homepage, login and admin gating.
- GitHub Actions separate `browser-smoke` job, in addition to the existing build/test/typecheck job.

## Beta release gates — all must pass before claiming launch
- [ ] Managed PostgreSQL, TLS and recovery-tested backups
- [ ] Versioned, reviewed Prisma migrations and `prisma migrate deploy` (current `db push` is for prototyping only)
- [ ] HTTPS host, trusted site origin, random session secret; run `npm run preflight:production` in protected environment
- [ ] Private S3-compatible bucket, scoped credentials, CORS, malware scanning, media retention, revocation tests
- [ ] Password recovery, authentication rate limiting, account deletion/privacy notice and security review
- [ ] Browser smoke suite green on CI; manual Android Chrome + iOS Safari verification
- [ ] Performance, error monitoring, incident playbook and database restore drill
- [ ] Verify access denial for revoked invitations, cross-event media isolation and admin moderation roles
- [ ] Payments must remain disabled pending provider onboarding, beneficiary/merchant-of-record approval, full refund and reconciliation testing
- [ ] Obtain hosted staging URL and perform a real end-to-end beta walkthrough before release

## Staged deployment
1. Create managed PostgreSQL and a Vercel project linked to this repository.
2. Add secrets in a protected host configuration, never in GitHub source or chat.
3. Run production preflight and a reviewed migration deployment on staging first.
4. Verify `/api/health/live`, `/api/health/ready`, signup, event creation, invite acceptance, reservation and moderation.
5. Pilot only with consenting testers. Do not claim production launch solely from CI success.

### Security
Never commit .env files, user data, private media, payment tokens, raw invitation tokens or logs with secrets.
