'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { requireEventAccess } from '@/lib/permissions';
import { deleteObject } from '@/lib/memory-storage';

/** Only event owner may approve/reject images; guests cannot self-approve. */
export async function setMediaStatusAction(form: FormData) {
  const user = await requireUser();
  const eventId = String(form.get('eventId') || '');
  const mediaId = String(form.get('mediaId') || '');
  const decision = form.get('decision');
  await requireEventAccess(eventId, user.id, 'owner');
  if (decision !== 'APPROVED' && decision !== 'REJECTED') throw new Error('Invalid moderation decision');
  await db.media.updateMany({ where: { id: mediaId, eventId, status: 'PENDING', uploadedAt: { not: null } },
    data: { status: decision, reviewedAt: new Date() },
  });
  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}#memories`);
}
export async function deleteMediaAction(form: FormData) {
  const user = await requireUser();
  const eventId = String(form.get('eventId') || '');
  const mediaId = String(form.get('mediaId') || '');
  await requireEventAccess(eventId, user.id, 'owner');
  const media = await db.media.findFirst({ where: { eventId, id: mediaId }, select: { storageKey: true } });
  if (media) {
    await deleteObject(media.storageKey);
    await db.media.deleteMany({ where: { id: mediaId, eventId } });
  }
  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}#memories`);
}
