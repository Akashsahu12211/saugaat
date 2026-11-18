 'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { requireEventAccess } from '@/lib/permissions';
import { newInvitationToken, hashInvitationToken } from '@/lib/invitations';
import { z } from 'zod';

const createSchema = z.object({
  eventId: z.string().min(1),
  label: z.string().trim().min(2).max(80),
  lifetimeDays: z.coerce.number().int().min(1).max(90),
  maxUses: z.union([z.literal(''), z.coerce.number().int().min(1).max(10000)]),
});

/** Host-only invitation creation; token is displayed once and stored only as SHA-256 hash. */
export async function createInvitationLinkAction(form: FormData) {
  const user = await requireUser();
  const input = createSchema.safeParse(Object.fromEntries(form));
  if (!input.success) throw new Error('Invalid invitation settings');
  const { eventId, label, lifetimeDays, maxUses } = input.data;
  const event = await requireEventAccess(eventId, user.id, 'owner');
  if (event.status !== 'PUBLISHED') throw new Error('Publish your event before sharing an invitation');
  const count = await db.invitationLink.count({ where: { eventId, revokedAt: null } });
  if (count >= 25) throw new Error('Maximum 25 active invitation links');
  const raw = newInvitationToken();
  await db.invitationLink.create({ data: {
    eventId, createdById: user.id, label, tokenHash: hashInvitationToken(raw),
    expiresAt: new Date(Date.now() + lifetimeDays * 86400000), maxUses: maxUses === '' ? null : maxUses,
  }});
  revalidatePath(`/dashboard/events/${eventId}`);
  // Only redirect the owner to the secret once. Do not add this URL to logs or analytics.
  redirect(`/dashboard/events/${eventId}?newInvite=${encodeURIComponent(raw)}`);
}
export async function revokeInvitationLinkAction(form: FormData) {
  const user = await requireUser();
  const eventId = String(form.get('eventId') || '');
  const linkId = String(form.get('linkId') || '');
  await requireEventAccess(eventId, user.id, 'owner');
  await db.invitationLink.updateMany({ where: { id: linkId, eventId, revokedAt: null }, data: { revokedAt: new Date() } });
  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}`);
}
export async function saveNotificationPreferencesAction(form: FormData) {
  const user = await requireUser();
  const emailUpdates = form.get('emailUpdates') === 'on';
  const whatsappUpdates = form.get('whatsappUpdates') === 'on';
  await db.notificationPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, emailUpdates, whatsappUpdates },
    update: { emailUpdates, whatsappUpdates },
  });
  revalidatePath('/dashboard/preferences');
  redirect('/dashboard/preferences?saved=1');
}
