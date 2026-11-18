'use server';
import { createHmac } from 'node:crypto';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { guestIdentity, persistGuestIdentity } from '@/lib/guest';
import { canAccessEvent } from '@/lib/invitations';
import { parseReportInput } from '@/lib/admin-policy';

export async function submitAbuseReportAction(form: FormData) {
  const eventId = String(form.get('eventId') ?? '');
  const mediaId = String(form.get('mediaId') ?? '');
  const { reason, details } = parseReportInput(form.get('reason'), form.get('details'));
  if (!eventId || eventId.length > 100 || mediaId.length > 100) throw new Error('Invalid request');
  const event = await db.event.findUnique({ where: { id: eventId },
    select: { id: true, slug: true, status: true, visibility: true, ownerId: true } });
  if (!event || !(await canAccessEvent(event))) throw new Error('Event invitation not authorized');
  if (mediaId) {
    const media = await db.media.findFirst({ where: { id: mediaId, eventId, status: 'APPROVED', uploadedAt: { not: null } }, select: { id: true } });
    if (!media) throw new Error('Media unavailable');
  }
  const user = await getUser();
  const visitor = await guestIdentity();
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('Session key missing');
  const identity = user ? 'user:'+user.id : 'guest:'+visitor.id;
  const reporterFingerprint = createHmac('sha256',secret).update('report:'+eventId+':'+identity).digest('hex');
  const recent = await db.abuseReport.count({ where: { reporterFingerprint, createdAt: { gte: new Date(Date.now()-86400000) } } });
  if (recent >= 3) throw new Error('Daily report limit reached');
  const duplicate = await db.abuseReport.findFirst({ where: { reporterFingerprint, eventId, mediaId: mediaId || null, status: 'OPEN' }, select: { id: true } });
  if (!duplicate) await db.abuseReport.create({ data: { eventId, mediaId: mediaId || null, reporterFingerprint, reason, details } });
  if (!user && visitor.needsCookie) await persistGuestIdentity(visitor.id);
  redirect('/e/'+event.slug+'?reported=1');
}
