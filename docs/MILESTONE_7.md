# Milestone 7 — Admin, Analytics and Moderation

## Implemented
- Explicit platform staff roles: ADMIN / MODERATOR, independent of event host/co-host.
- Restricted server-rendered admin dashboard, reports queue, event metadata and audit log.
- Invitations required to submit abuse/privacy reports from event pages.
- Pseudonymized reporter identities and best-effort daily reporting limits.
- Database-transaction moderation with audit trail and private-media hiding on ACTIONED.
- Real aggregate statistics; no fake financial or guest metrics.

## Provisioning an administrator
Do not grant platform roles from email address alone; signup does not independently verify email ownership.
After independently verifying the operator identity, use a trusted database console and the verified internal **user ID**:

```sql
INSERT INTO "AdminAccount" ("userId", role, "createdAt")
VALUES ('<VERIFIED_USER_ID>', 'ADMIN'::"AdminRole", now())
ON CONFLICT ("userId") DO NOTHING;
```

This is intentionally not exposed as a browser endpoint.

## Remaining production gates
- Run Prisma schema application against a development PostgreSQL DB and check CI.
- E2E role/authorization tests for uninvited visitors, hosts, moderators and admins.
- Real WAF rate limits, report pagination, retention policies, and operational alerts.
- Live media storage and UPI payment onboarding are separate release gates.
