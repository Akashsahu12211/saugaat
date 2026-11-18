# Saugaat — Full-stack Development Starter (Milestones 1–3)

A premium festive, India-first gift registry and event platform built on Next.js 16, React 19, TypeScript, Prisma 7 and PostgreSQL. This is **an early development milestone**, not the entire finished startup.

## Included now
- Responsive festive landing page, occasions, login, signup, host dashboard
- Secure password hashing and signed httpOnly sessions
- Private draft event creation, publication and shareable event URL
- Manual / retailer-link gift addition and INR formatting
- Anonymous browser-based gift reservations with serializable transaction safeguards
- Ownership checks for editing and authenticated reservation cancellation
- RSVP form for guests and host-side RSVP list; co-host invitations, role checks and gift tracking; Shared Memories models

## Required tools
- Node.js 22.18+ (or supported current Node 24+) / npm
- Docker Desktop (or a reachable PostgreSQL instance)
- PostgreSQL connection string and a securely generated session secret

## Quick start
**Development status:** TypeScript syntax was checked without dependencies. Full typecheck, database migration and runtime tests need a Node 22.18+/24 environment with package downloads and PostgreSQL.
```bash
cp .env.example .env
# Replace SESSION_SECRET with output of: openssl rand -base64 48
# Use your own strong database credentials for production

docker compose up -d
npm install
npm run db:generate
npm run db:migrate
npm run dev
```
Open http://localhost:3000. Sign up, create an event, add gifts, publish, and open the guest link in an incognito browser to test no-login reservations and RSVP.

## GitHub integration
The linked GitHub App currently only has access to a different organization; writes to this personal repository return 403. Connect the personal account and grant access to the `saugaat` repository before asking the assistant to push changes. The ZIP can also be imported manually via Git.

## Security & limitations
- **MVP note**: A published registry is accessible by its unguessable share link; it is not invitation-authenticated. Shared Memories are **not implemented** yet; privacy enforcement must be added before uploads launch.
- Real UPI payments, group gifting, photo/video storage, co-host invitation email delivery, email verification, reset-password, rate limiting, bot protection, audit logging, account export/delete and stronger invitation access are **not yet implemented**. Do not collect real money or sensitive guest data with this starter.
- Dev server requires PostgreSQL and environment variables. Error/status handling should be extended to user-friendly messages.
- Before deploying, configure email verification, rate limits, HTTPS, monitoring, migrations and a production database. Seek appropriate payments/privacy compliance review for India.
- Demo credentials are **not shipped**; create a user locally.

## Architecture
- `src/app`: page routes and React server components
- `src/lib/actions.ts`: authenticated server actions for core mutations
- `src/lib/auth.ts`: signed session cookies
- `src/lib/db.ts`: Prisma/PostgreSQL client
- `prisma/schema.prisma`: core database entities, planned future modules
- `src/app/globals.css`: Saugaat festive design tokens and responsive styles

## Full roadmap
1. Foundation (initial source): auth, events, dashboard, registry.
2. Guest flow (source implemented, untested against DB): anonymous reservation, cancellation and RSVP. OTP / abuse prevention and invite-based access remain pending.
3. Co-host invites, gift quantity/priority/category editing, manual purchase tracking (source implemented; requires DB tests).
4. Memories: private object storage, short-lived signed URLs, moderation, media processing, delete/export.
5. Group gifting: authorized gateway and compliant host disbursements, reconciliation and refund states.
6. Growth: WhatsApp opt-in notifications, merchant affiliate program, Hindi localization, analytics.
7. Production: automated tests, CI, security review, backups, uptime and accessibility/performance testing.

## Design reference
The existing editable Figma file for the broader UI design is: https://www.figma.com/design/HShkzcRZEXfrUnlM75cQNl . Final visual polish and clickable prototype may still be pending.
