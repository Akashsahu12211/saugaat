import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { memoryAccess } from '@/lib/memory-access';
import { viewUrl } from '@/lib/memory-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id || id.length > 100) return new NextResponse('Not found', { status: 404 });
  const media = await db.media.findUnique({ where: { id }, select: {
    eventId: true, storageKey: true, fileName: true, status: true, uploadedAt: true,
  } });
  if (!media || !media.uploadedAt) return new NextResponse('Not found', { status: 404 });
  const access = await memoryAccess(media.eventId, 'view');
  if (!access || (!access.staff && media.status !== 'APPROVED')) return new NextResponse('Not found', { status: 404 });
  const link = await viewUrl(media.storageKey, media.fileName);
  return NextResponse.redirect(link, { status: 302, headers: {
    'Cache-Control': 'private, no-store, max-age=0', 'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
  } });
}
