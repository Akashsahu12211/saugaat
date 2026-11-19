import 'server-only';
import { createHmac } from 'node:crypto';
import { headers } from 'next/headers';
import { db } from '@/lib/db';

/**
 * Shared, atomic PostgreSQL auth throttles. Keys are HMACs, never raw emails or
 * IP addresses. The DB migration must be applied before deploying these actions.
 * These limits are a defense-in-depth measure, not a substitute for edge WAF/CAPTCHA.
 */
type Action = 'login' | 'signup';

function keyedIdentifier(value: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters');
  return createHmac('sha256', secret).update(value).digest('hex');
}

async function incrementBucket(id: string, ceiling: number, seconds: number): Promise<boolean> {
  const rows = await db.$queryRaw<Array<{ attempts: number }>>`
    INSERT INTO "AuthThrottle" ("id", "attempts", "resetAt")
    VALUES (${id}, 1, NOW() + (${seconds} * INTERVAL '1 second'))
    ON CONFLICT ("id") DO UPDATE SET
      "attempts" = CASE
        WHEN "AuthThrottle"."resetAt" <= NOW() THEN 1
        ELSE "AuthThrottle"."attempts" + 1
      END,
      "resetAt" = CASE
        WHEN "AuthThrottle"."resetAt" <= NOW()
          THEN NOW() + (${seconds} * INTERVAL '1 second')
        ELSE "AuthThrottle"."resetAt"
      END
    RETURNING "attempts"
  `;
  return (rows[0]?.attempts ?? ceiling + 1) <= ceiling;
}

export async function allowAuthAttempt(action: Action, email: string): Promise<boolean> {
  const h = await headers();
  // Vercel's upstream forwarding header is preferred. Untrusted proxies can
  // spoof forwarding headers; production WAF/IP protections remain necessary.
  const originAddress = (h.get('x-vercel-forwarded-for') || h.get('x-forwarded-for') || 'unknown')
    .split(',')[0].trim().slice(0, 100);
  const identity = keyedIdentifier(`identity:${action}:${email.trim().toLowerCase()}`);
  const address = keyedIdentifier(`ip:${action}:${originAddress}`);
  const perIdentity = action === 'login' ? 15 : 8;
  const perAddress = action === 'login' ? 90 : 25;
  // Both buckets are incremented even on rejection, preventing easy resets.
  const byIdentity = await incrementBucket(identity, perIdentity, 15 * 60);
  const byAddress = await incrementBucket(address, perAddress, 15 * 60);
  return byIdentity && byAddress;
}
