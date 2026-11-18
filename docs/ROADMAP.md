# Saugaat engineering roadmap — source and launch status

## Legend
- **CI verified**: source exists and the automated test / typecheck / build jobs previously passed. This does NOT verify real cloud integrations or production security.
- **Cloud verification pending**: requires a configured environment, data and end-to-end acceptance checks.
- **Released**: working HTTPS deployment, monitored with backups and completed acceptance checks.

| Milestone | Deliverable | Current status | Outstanding release gate |
| --- | --- | --- | --- |
| 1 | Auth, users, host event creator, dashboard | Source implemented; CI verified | Managed DB, signup / event creation walkthrough, rate limits and account recovery |
| 2 | Anonymous guest registry, reservations and RSVP | Source implemented; CI verified | PostgreSQL concurrency and real-user browser tests |
| 3 | Co-hosts, invites and gift tracking | Source implemented; CI verified | Cross-event permission and purchase-state integration tests |
| 4 | WhatsApp share links, QR, revocable guest access | Source implemented; CI verified | Revocation, consent and expiry in staging |
| 5 | Private Shared Memories, media review and downloads | Source implemented; CI verified | Private object storage, upload/download, scanning and deletion tests |
| 6 | Group gifting and pledge bookkeeping | Pledges and test-mode webhook foundations; CI verified | Merchant/provider approval, hosted checkout, refund/reconciliation; live payments disabled |
| 7 | Admin moderation, reports and analytics | Source implemented; CI verified | Admin provisioning, abuse workflow and audit review against staging |
| 8 | CI, preflight, browser-smoke, staging | CI and browser-smoke previously verified; **deployment pending** | Vercel + Neon, reviewed migrations, operational security and pilot |

## Important security and product constraints
- India-first and WhatsApp-first, mobile web before native apps.
- Never expose guest media without verified permission; private albums default to private.
- Avoid duplicate gift reservations through transactional database rules.
- Guest contributions remain pledges unless a real provider event verifies payment.
- Payments must remain disabled pending legal and financial compliance.
- No secrets, invitation tokens, payment credentials or private photographs in source control.
- Admin roles are provisioned server-side; guests cannot promote themselves.
- A passing CI build is **not** a staging deployment.

## Next action — staging setup
See [docs/STAGING_DEPLOYMENT.md](STAGING_DEPLOYMENT.md) for exact deployment prerequisites and acceptance checklist. Vercel and Neon connections require repository-owner authorization. The current CI uses ephemeral `prisma db push`; production needs reviewed migrations and `prisma migrate deploy` before launch.
