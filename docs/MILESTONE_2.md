# Milestone 2 — Guest journeys and RSVP

## Implemented in the source code
- A published registry link can be viewed without signing up or installing an app.
- Guests reserve gifts anonymously using a signed HttpOnly browser identity cookie.
- Serializable DB transactions with retry on Prisma P2034 limit reservations to available gift quantity.
- Guests can cancel their own active reservation from the same browser.
- RSVP name, party size and attending/declined status are stored per event and anonymous browser identity.
- The host can see responses in their event dashboard; guest contact details are not requested.
- Event is promoted to LINK_ONLY on publication; private Shared Memories are never displayed on the open registry page.

## Not production-ready / security follow-ups
- Add rate limiting on public actions, anti-bot measures, cookie/session revocation and abuse monitoring.
- Anonymous reservations tied to browser cookies can be lost on cookie deletion. Add optional verified email/OTP recovery before pilot.
- Integrate invite-specific revocable tokens before exposing sensitive event data.
- Add retention/deletion/privacy notice for RSVP names; do not expose RSVP list publicly.
- Test reservation races against real PostgreSQL with Prisma migrations. Transaction isolation alone must be verified by an integration test.
- Photos and group payments are not implemented. Never imply a payment succeeded without verified provider callbacks.
- The repo is publicly accessible: do not commit `.env` or real user/event data.
