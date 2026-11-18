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
Open http://localhost:3000. Sign up, create an event, add gifts, publish, then generate a secure invite (with a QR code) in the event dashboard. Open that invite in an incognito browser to test account-free reservations and RSVP.

## GitHub integration
Repository: https://github.com/Akashsahu12211/saugaat
The personal-account GitHub connection is authorized and the development source has been committed to `main`.

## Security & limitations
- Published registries require a host-issued **revocable, expiring invitation token**. Token hashes are stored at rest; server-side access checks run for guest views and mutations. QR and WhatsApp sharing require a user click.
- A newly issued invitation link is shown to its creator only on the creation redirect. Treat its URL as a secret; sharing gives access to the registry, **not** to Shared Memories.
- Shared Memories, email/WhatsApp notification delivery, payment processing and platform administration are **not yet implemented**. Notification opt-in choices only record preferences.
- Email verification, password reset, API rate limiting, bot protection, audit logging, account export/delete, data retention and comprehensive privacy controls remain required before public beta.
- Dependencies must be installed, Prisma schema applied, and database concurrency tests completed before claiming a working production app.
- Set `NEXT_PUBLIC_SITE_URL` to the trusted HTTPS origin for deployed QR links; do not commit production credentials.

## Architecture
- `src/app`: page routes and React server components
- `src/lib/actions.ts`: authenticated server actions for core mutations
- `src/lib/auth.ts`: signed session cookies
- `src/lib/db.ts`: Prisma/PostgreSQL client
- `prisma/schema.prisma`: core database entities, planned future modules
- `src/app/globals.css`: Saugaat festive design tokens and responsive styles

## Full roadmap
1. **Foundation (source drafted):** auth, events, dashboard, registry.
2. **Guest flow (source drafted):** anonymous reservation, cancellation, RSVP; real concurrency and abuse testing required.
3. **Co-hosts and tracking (source drafted):** role-based access, invites, gift quantity and purchase tracking.
4. **Secure invitations (source drafted):** expiring/revocable links, QR codes, WhatsApp click-to-share and notification preferences; database verification pending.
5. **Private Shared Memories (planned):** authorized private uploads, signed URLs, moderation, albums, deletion and storage limits.
6. **Group gifting (planned):** Indian authorized payment provider, reconciled webhooks, refunds and audit trail.
7. **Admin and analytics (planned):** moderation, restrictive staff permissions, privacy-protecting metrics.
8. **Testing and launch (planned):** CI passing, integration and performance tests, security review, backups, beta deployment.

## Design reference
The existing editable Figma file for the broader UI design is: https://www.figma.com/design/HShkzcRZEXfrUnlM75cQNl . Final visual polish and clickable prototype may still be pending.