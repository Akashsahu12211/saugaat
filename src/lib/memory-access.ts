import 'server-only';
import { getUser } from '@/lib/auth';
import { guestIdentity } from '@/lib/guest';
import { canAccessMedia } from '@/lib/invitations';
import { db } from '@/lib/db';

export async function memoryAccess(eventId: string, action: 'view' | 'upload') {
  const event = await db.event.findUnique({
    where: { id: eventId }, select: { id: true, ownerId: true, slug: true, status: true, visibility: true },
  });
  if (!event) return null;
  if (!(await canAccessMedia(event, action))) return null;
  const user = await getUser();
  const guest = await guestIdentity();
  const owner = user?.id === event.ownerId;
  const cohost = !!user && !owner && !!(await db.eventMember.findUnique({ where: {
    eventId_userId: { eventId: event.id, userId: user.id },
  }, select: { id: true } }));
  return { event, user, guest, canModerate: owner, staff: owner || cohost };
}
