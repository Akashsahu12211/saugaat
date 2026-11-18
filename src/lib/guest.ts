import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const COOKIE_NAME = 'saugaat_guest';
const DURATION_SECONDS = 60 * 60 * 24 * 90;

function signingKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters');
  return new TextEncoder().encode(secret);
}

/** Random pseudonymous browser identity. No email, phone number or name is required to reserve. */
export async function guestIdentity(): Promise<{ id: string; needsCookie: boolean }> {
  const existing = (await cookies()).get(COOKIE_NAME)?.value;
  if (existing) {
    try {
      const { payload } = await jwtVerify(existing, signingKey(), { algorithms: ['HS256'], issuer: 'saugaat' });
      if (payload.sub && /^[0-9a-f-]{36}$/.test(payload.sub)) return { id: payload.sub, needsCookie: false };
    } catch { /* A missing, expired or forged guest cookie starts a new identity. */ }
  }
  return { id: crypto.randomUUID(), needsCookie: true };
}

export async function persistGuestIdentity(id: string) {
  const token = await new SignJWT({ sub: id })
    .setProtectedHeader({ alg: 'HS256' }).setIssuer('saugaat')
    .setIssuedAt().setExpirationTime(`${DURATION_SECONDS}s`).sign(signingKey());
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', path: '/', maxAge: DURATION_SECONDS,
  });
}
