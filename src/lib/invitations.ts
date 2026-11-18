import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { db } from '@/lib/db';
import { getUser } from '@/lib/auth';

type EventAccess = { id: string; ownerId: string; status: string; visibility: string };
const COOKIE_PREFIX = 'saugaat_access_';
const TTL_SECONDS = 60 * 60 * 24 * 7;
function key() {
  const v = process.env.SESSION_SECRET;
  if (!v || v.length < 32) throw new Error('SESSION_SECRET must have at least 32 characters');
  return new TextEncoder().encode(v);
}
export function hashInvitationToken(raw: string) {
  return createHash('sha256').update(raw).digest('hex');
}
export function newInvitationToken() {
  return randomBytes(32).toString('base64url');
}
export function validInvitationToken(raw: string): boolean {
  return /^[A-Za-z0-9_-]{40,64}$/.test(raw);
}
function cookieName(eventId: string) { return `${COOKIE_PREFIX}${eventId}`; }

export async function establishInvitationAccess(eventId: string, invitationLinkId: string, expiresAt: Date) {
  const seconds = Math.max(1, Math.min(TTL_SECONDS, Math.floor((expiresAt.getTime() - Date.now()) / 1000)));
  const jwt = await new SignJWT({ eventId, invitationLinkId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('saugaat-invitations').setAudience('saugaat-event-guest')
    .setIssuedAt().setExpirationTime(`${seconds}s`).sign(key());
  (await cookies()).set(cookieName(eventId), jwt, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    path: '/', maxAge: seconds,
  });
}

export async function canAccessEvent(event: EventAccess): Promise<boolean> {
  if (event.status !== 'PUBLISHED' || event.visibility !== 'LINK_ONLY') return false;
  const user = await getUser();
  if (user?.id === event.ownerId) return true;
  if (user) {
    const membership = await db.eventMember.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: user.id } }, select: { id: true },
    });
    if (membership) return true;
  }
  const token = (await cookies()).get(cookieName(event.id))?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, key(), {
      algorithms: ['HS256'], issuer: 'saugaat-invitations', audience: 'saugaat-event-guest',
    });
    if (payload.eventId !== event.id || typeof payload.invitationLinkId !== 'string') return false;
    const valid = await db.invitationLink.findFirst({
      where: { id: payload.invitationLinkId, eventId: event.id, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true },
    });
    return Boolean(valid);
  } catch { return false; }
}
