# Milestone 3 — Co-hosts and gift tracking

## Implemented in source
- Per-event owner-only co-host invitation records; invitees must already have a Saugaat account.
- Recipient accepts invitation in their own authenticated dashboard; only acceptance creates EventMember permissions.
- Owner can withdraw pending invitations or revoke granted co-host access.
- Owner and co-host event list; edit gift metadata, category, priority and quantity.
- Inventory check prevents decreasing gift quantity below active reservations.
- Host/co-host can mark an existing reservation as purchased or revert to reserved. This is a **manual tracking label**, not payment verification.
- Role-based server authorization for all management actions and RSVP viewer.

## Unresolved before release
- Invitation email sending (current MVP: invitee must log into dashboard to see pending invites).
- Database-backed concurrency tests for simultaneous co-host accepts and gift changes vs reservations.
- Stronger invitation anti-abuse and rate limiting, authentication verification, structured audit logs.
- Real product photo importing, payment gateway, and private Shared Memories.
- Live app build with npm dependencies and PostgreSQL instance.

## Manual acceptance checklist
1. Account A creates and publishes an event; Account B registers separately.
2. Account A invites B by email. B sees invitation only while logged in.
3. B accepts and sees event in their dashboard. Account C must not see event or RSVP names.
4. B edits gift title/quantity; A sees updates.
5. Guest reserves gift; A marks reservation purchased; guest can no longer cancel purchased reservation.
6. A revokes B; B may no longer open event admin or call mutation endpoints.
7. For a gift with a reservation, attempt to reduce quantity below count: server rejects.

Note: acceptance tests listed above are **not yet marked passed**; this document describes how to verify the implementation.
