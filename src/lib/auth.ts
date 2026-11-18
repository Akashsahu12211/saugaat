import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
const COOKIE = 'saugaat_session';
const TTL = 60 * 60 * 24 * 7;
function key() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters');
  return new TextEncoder().encode(value);
}
export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId }).setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt().setExpirationTime(`${TTL}s`).sign(key());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', path: '/', maxAge: TTL,
  });
}
export async function clearSession() { (await cookies()).delete(COOKIE); }
export async function getUser() {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return null;
  try {
    const { payload } = await jwtVerify(value, key(), { algorithms: ['HS256'] });
    if (!payload.sub) return null;
    return await db.user.findUnique({ where: { id: payload.sub }, select: { id: true, name: true, email: true } });
  } catch { return null; }
}
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect('/login');
  return user;
}
