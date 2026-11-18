# Milestone 4 — secure guest invitations and WhatsApp sharing

## Implementation
- Cryptographically random 256-bit invitation tokens; SHA-256 hashes stored at rest.
- Host-only creation/revocation with optional usage limit and 1–90 day expiry.
- Atomic serializable redemption and short-lived signed event-access cookie.
- Server-side revalidation on guest page, gift reservation, RSVP and cancellation.
- Browser-native sharing and explicit WhatsApp `wa.me` share action (no automated messaging).
- QR generated in app by `qrcode`, no third-party QR generator or image service.
- User notification **preferences** (opt-in), not a delivery integration.

## Important trade-offs and remaining requirements
- The raw invitation token is shown *once*. It is not recoverable from its hash.
- Sharing link grants registry access only; it does not grant permission to view private photos.
- Invitation URLs in browser history are sensitive: avoid query analytics and redact invite routes in access logs.
- Max-uses counts successful link redemptions, not distinct guests or devices. Existing signed sessions retain access until revocation/expiration.
- Guest cookies are per-event, scoped by eventId; cross-browser transfer requires an invitation link.
- Notification delivery needs an opt-in provider and abuse controls before pilot.
- Full integration/load/security tests against PostgreSQL, Next.js build, responsive browser review are still needed.
