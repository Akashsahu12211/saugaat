import 'server-only';
import { db } from '@/lib/db';

/** The event owner is the only administrator. Co-hosts can edit registry and view guest lists. */
export async function requireEventAccess(eventId: string, userId: string, level: 'view' | 'edit' | 'owner' = 'view') {
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { id: true, ownerId: true, slug: true, status: true, members: { where: { userId }, select: { role: true } } },
  });
  if (!event) throw new Error('Event not found');
  const isOwner = event.ownerId === userId;
  const isCohost = event.members.some(member => member.role === 'COHOST');
  if (!isOwner && (level === 'owner' || !isCohost)) throw new Error('Not authorized for this event');
  return { ...event, isOwner, isCohost, canEdit: isOwner || isCohost };
}
