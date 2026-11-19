import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db } from '@/lib/db';
import { memoryAccess } from '@/lib/memory-access';
import { MEDIA_TYPES, signUpload, verifyMediaInput } from '@/lib/memory-storage';
import { persistGuestIdentity } from '@/lib/guest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const input = z.object({
  eventId: z.string().min(1).max(100),
  fileName: z.string().min(1).max(160),
  mimeType: z.string(),
  sizeBytes: z.number().int().positive(),
  album: z.string().min(1).max(60),
});

export async function POST(req: NextRequest) {
  if (process.env.PRIVATE_MEDIA_UPLOADS_ENABLED !== 'true') return NextResponse.json({ error: 'Private media uploads are not enabled' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  // Strict same-origin JSON request; browser cookies cannot be used by third-party sites.
  const origin = req.headers.get('origin');
  const expectedOrigin = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin : req.nextUrl.origin;
  if (origin !== expectedOrigin) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  if (!(req.headers.get('content-type') || '').startsWith('application/json')) return NextResponse.json({ error: 'JSON required' }, { status: 415 });
  let payload: unknown;
  try { payload = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const parsed = input.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid upload details' }, { status: 400 });
  const { eventId, fileName, mimeType, sizeBytes, album } = parsed.data;
  let ext: string;
  try { ext = verifyMediaInput(mimeType, sizeBytes, album, fileName); }
  catch { return NextResponse.json({ error: 'File type or size not permitted' }, { status: 400 }); }
  const access = await memoryAccess(eventId, 'upload');
  if (!access) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  const count = await db.media.count({ where: { eventId } });
  if (count >= 500) return NextResponse.json({ error: 'Event media limit reached' }, { status: 429 });
  if (!access.staff) {
    const pending = await db.media.count({ where: { eventId, visitorId: access.guest.id, status: 'PENDING' } });
    if (pending >= 10) return NextResponse.json({ error: 'Upload queue is full' }, { status: 429 });
  }
  const key = `private/events/${eventId}/${randomUUID()}.${ext}`;
  const uploadExpiresAt = new Date(Date.now() + 5 * 60_000);
  // Sign before persisting; failed configuration never leaves a pending DB row.
  const presigned = await signUpload(key, mimeType, MEDIA_TYPES[mimeType].max);
  const media = await db.media.create({ data: {
    eventId, uploaderId: access.user?.id ?? null, visitorId: access.guest.id,
    storageKey: key, mimeType, sizeBytes, fileName, album: album.trim(), uploadExpiresAt,
  }, select: { id: true } });
  if (access.guest.needsCookie) await persistGuestIdentity(access.guest.id);
  return NextResponse.json({ mediaId: media.id, upload: presigned }, { headers: { 'Cache-Control': 'no-store' } });
}
