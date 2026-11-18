import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { memoryAccess } from '@/lib/memory-access';
import { validateObject } from '@/lib/memory-storage';

export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  const expectedOrigin = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin : req.nextUrl.origin;
  if (req.headers.get('origin') !== expectedOrigin) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  if (!(req.headers.get('content-type') || '').startsWith('application/json')) return NextResponse.json({ error: 'JSON required' }, { status: 415 });
  let payload: { mediaId?: string };
  try { payload = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  if (typeof payload?.mediaId !== 'string' || payload.mediaId.length > 100) return NextResponse.json({ error: 'Invalid media' }, { status: 400 });
  const media = await db.media.findUnique({ where: { id: payload.mediaId }, select: {
    id: true, eventId: true, uploaderId: true, visitorId: true, uploadedAt: true,
    uploadExpiresAt: true, storageKey: true, mimeType: true, sizeBytes: true,
  } });
  if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const access = await memoryAccess(media.eventId, 'upload');
  if (!access || (!access.staff && (media.visitorId !== access.guest.id || !media.visitorId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (media.uploadedAt) return NextResponse.json({ ok: true, pendingApproval: true });
  if (media.uploadExpiresAt <= new Date()) return NextResponse.json({ error: 'Upload intent expired' }, { status: 410 });
  const valid = await validateObject(media.storageKey, media.mimeType, media.sizeBytes);
  if (!valid) return NextResponse.json({ error: 'Upload missing or invalid' }, { status: 422 });
  await db.media.updateMany({ where: { id: media.id, uploadedAt: null }, data: { uploadedAt: new Date() } });
  return NextResponse.json({ ok: true, pendingApproval: true }, { headers: { 'Cache-Control': 'no-store' } });
}
