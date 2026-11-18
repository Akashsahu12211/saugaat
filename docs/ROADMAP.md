# Saugaat engineering delivery plan — eight milestones

## Status legend
- **Source drafted**: code exists locally but may not pass full integration tests.
- **Verified**: automated tests, acceptance check and security review have passed.
- **Released**: deployed and monitored for pilot users.

| Milestone | Deliverable | Current state | Completion gate |
| --- | --- | --- | --- |
| 1 | Project setup, auth, users, event editor, dashboard | Source drafted | App boots, migrates database, host event test passes |
| 2 | No-login guest registry, quantity-safe reservations and RSVP | Source drafted | PostgreSQL race tests, anonymous cookie/session tests, mobile UX |
| 3 | Co-host roles, invitation and gift tracking | Source drafted; DB verification pending | Cross-tenant authorization tests; gift purchase-state rules |
| 4 | WhatsApp sharing, QR, revocable invitations and notification preferences | Source drafted; unverified against production DB | Invitation security + consent tests |
| 5 | Private Shared Memories uploads, moderation, albums, deletion | Planned | Signed media URLs, permission and privacy tests |
| 6 | Indian provider-backed group gifting | Planned — requires approval | Reconciled webhook, failed payment, refund, KYC and audit tests |
| 7 | Admin moderation, analytics and abuse management | Planned | Restrictive roles, audit trails, privacy review |
| 8 | CI, full regression, deployment and beta pilot | Planned | Mobile accessibility, security, backup, load testing, monitored pilot |

## Non-negotiable product constraints
- India-first and WhatsApp-first, mobile browser before native applications.
- All occasions supported through templates and custom event details.
- No guest account required to view a public invitation registry.
- Media is private by default and never exposed from an unverified link.
- Direct retailer checkout is separate from Saugaat; group payments remain disabled until a compliant provider is integrated.
- No real payment success status without provider confirmation.

## Data and permission notes
- Guest reservation currently uses a long-lived, signed pseudonymous browser cookie; clearing browser data can lose cancellation rights.
- Host sees names and attendance; public event page does not display other people's RSVP details.
- Guest input validation and authorization happen on the server; public mutation rate limiting remains a pre-pilot requirement.
- PRIVATE is the draft/default event visibility; on publishing, the *registry* becomes LINK_ONLY while *media* remains separately gated.
- Public repository never stores credentials, private photographs or end-user details.

## Next verification and action
1. Grant GitHub App write access to `Akashsahu12211/saugaat` personal repo.
2. Run `npm install && npm run db:generate && npx prisma db push && npm run typecheck && npm run build` with Node 22.18+/24 and PostgreSQL.
3. Add a real Postgres concurrency test for simultaneous reservations on quantity=1.
4. Keep Milestone 3–8 open until accepted and demonstrated.
