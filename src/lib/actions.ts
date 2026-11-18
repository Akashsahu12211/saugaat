'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { clearSession, createSession, getUser, requireUser } from '@/lib/auth';
import { credentials, signup, eventInput, giftInput, rsvpInput, cohostInviteInput, giftSettingsInput } from '@/lib/validation';
import { requireEventAccess } from '@/lib/permissions';
import { guestIdentity, persistGuestIdentity } from '@/lib/guest';
import { Prisma } from '@/generated/prisma/client';
import { canAccessEvent } from '@/lib/invitations';

function withMessage(route: string, text: string): never {
  redirect(`${route}?error=${encodeURIComponent(text)}`);
}
function slugify(s: string) { return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'celebration'; }
export async function registerAction(form: FormData) {
  const parsed = signup.safeParse(Object.fromEntries(form));
  if (!parsed.success) withMessage('/signup', 'Enter a valid name, email and password (10+ characters).');
  const { name, email, password } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) withMessage('/signup', 'Email is already registered.');
  const user = await db.user.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 12) } });
  await createSession(user.id);
  redirect('/dashboard');
}
export async function loginAction(form: FormData) {
  const parsed = credentials.safeParse(Object.fromEntries(form));
  if (!parsed.success) withMessage('/login', 'Invalid email or password.');
  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) withMessage('/login', 'Invalid email or password.');
  await createSession(user.id);
  redirect('/dashboard');
}
export async function logoutAction() { await clearSession(); redirect('/'); }
export async function createEventAction(form: FormData) {
  const user = await requireUser();
  const parsed = eventInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) withMessage('/events/new', 'Please review the event details.');
  const { title, occasion, date, location, description } = parsed.data;
  const event = await db.event.create({ data: {
    title, occasion, date: new Date(`${date}T12:00:00+05:30`), location, description,
    ownerId: user.id, slug: `${slugify(title)}-${crypto.randomUUID().slice(0, 8)}`,
    visibility: 'PRIVATE', status: 'DRAFT',
  } });
  redirect(`/dashboard/events/${event.id}`);
}
export async function addGiftAction(form: FormData) {
  const user = await requireUser();
  const parsed = giftInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) withMessage('/dashboard', 'Invalid gift details.');
  const { eventId, title, url, price } = parsed.data;
  const event = await requireEventAccess(eventId, user.id, 'edit');
  const numericPrice = price?.trim() ? Number(price) : null;
  if (numericPrice !== null && (!Number.isFinite(numericPrice) || numericPrice <= 0 || numericPrice > 10000000))
    withMessage(`/dashboard/events/${event.id}`, 'Please enter a valid price.');
  await db.gift.create({ data: { eventId, title, url: url || null, pricePaise: numericPrice === null ? null : Math.round(numericPrice * 100) } });
  revalidatePath(`/dashboard/events/${event.id}`);
  redirect(`/dashboard/events/${event.id}`);
}
export async function publishEventAction(form: FormData) {
  const user = await requireUser();
  const eventId = String(form.get('eventId') || '');
  const event = await requireEventAccess(eventId, user.id, 'owner');
  await db.event.update({ where: { id: eventId }, data: { status: 'PUBLISHED', visibility: 'LINK_ONLY' } });
  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}`);
}
// Public gift pages do not require an account or app installation.
// A signed, anonymous browser identity lets a guest cancel their own reservation.
// SERIALIZABLE with retries makes quantity checks safe under concurrent requests.
export async function reserveGiftAction(form: FormData) {
  const user = await getUser();
  const visitor = await guestIdentity();
  const giftId = String(form.get('giftId') || '');
  const eventSlug = String(form.get('eventSlug') || '');
  const event = await db.event.findUnique({ where: { slug: eventSlug } });
  if (!event || !(await canAccessEvent(event))) throw new Error('Event unavailable');
  if (user?.id === event.ownerId) withMessage(`/e/${event.slug}`, 'Hosts cannot reserve their own gifts.');
  let saved = false;
  for (let attempt = 0; attempt < 3 && !saved; attempt++) {
    try {
      await db.$transaction(async tx => {
        const gift = await tx.gift.findFirst({ where: { id: giftId, eventId: event.id } });
        if (!gift) throw new Error('Gift not found');
        const existing = await tx.reservation.count({ where: {
          giftId,
          status: { in: ['RESERVED', 'PURCHASED'] },
          OR: [{ visitorId: visitor.id }, ...(user ? [{ guestUserId: user.id }] : [])],
        } });
        if (existing > 0) throw new Error('Already reserved');
        const taken = await tx.reservation.count({ where: { giftId, status: { in: ['RESERVED', 'PURCHASED'] } } });
        if (taken >= gift.quantity) throw new Error('Fully reserved');
        await tx.reservation.create({ data: {
          giftId, eventId: event.id, guestUserId: user?.id ?? null, visitorId: visitor.id,
        } });
      }, { isolationLevel: 'Serializable' });
      saved = true;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034' && attempt < 2) continue;
      withMessage(`/e/${event.slug}`, 'This gift could not be reserved. Please choose another or try again.');
    }
  }
  if (!saved) withMessage(`/e/${event.slug}`, 'Please retry your reservation.');
  if (visitor.needsCookie) await persistGuestIdentity(visitor.id);
  revalidatePath(`/e/${event.slug}`);
  redirect(`/e/${event.slug}?success=reserved`);
}

export async function cancelReservationAction(form: FormData) {
  const user = await getUser();
  const visitor = await guestIdentity();
  const reservationId = String(form.get('reservationId') || '');
  const reservation = await db.reservation.findFirst({ where: {
    id: reservationId,
    status: 'RESERVED',
    OR: [{ visitorId: visitor.id }, ...(user ? [{ guestUserId: user.id }] : [])],
  }, include: { event: true } });
  if (!reservation || !(await canAccessEvent(reservation.event))) throw new Error('Reservation not found or access revoked');
  // Conditional update avoids undoing a concurrent host purchase confirmation.
  const result = await db.reservation.updateMany({
    where: { id: reservationId, status: 'RESERVED', OR: [{ visitorId: visitor.id }, ...(user ? [{ guestUserId: user.id }] : [])] },
    data: { status: 'CANCELLED' },
  });
  if (!result.count) withMessage(`/e/${reservation.event.slug}`, 'This reservation is no longer cancellable.');
  revalidatePath(`/e/${reservation.event.slug}`);
  redirect(`/e/${reservation.event.slug}?success=cancelled`);
}

export async function submitRSVPAction(form: FormData) {
  const parsed = rsvpInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const slug = String(form.get('eventSlug') || '');
    withMessage(/^[a-z0-9-]{1,100}$/.test(slug) ? `/e/${slug}` : '/', 'Please provide your name and RSVP response.');
  }
  const { eventSlug, name, rsvp, partySize } = parsed.data;
  const event = await db.event.findUnique({ where: { slug: eventSlug } });
  if (!event || !(await canAccessEvent(event))) throw new Error('Event unavailable');
  const guest = await guestIdentity();
  await db.guest.upsert({
    where: { eventId_visitorId: { eventId: event.id, visitorId: guest.id } },
    create: { eventId: event.id, visitorId: guest.id, name, rsvp, partySize: rsvp === 'ATTENDING' ? partySize : 1 },
    update: { name, rsvp, partySize: rsvp === 'ATTENDING' ? partySize : 1 },
  });
  if (guest.needsCookie) await persistGuestIdentity(guest.id);
  revalidatePath(`/e/${event.slug}`);
  redirect(`/e/${event.slug}?success=rsvp`);
}


/** Only the owner can invite or remove co-hosts. No invitation secrets are sent to browser. */
export async function inviteCohostAction(form: FormData) {
  const user = await requireUser();
  const parsed = cohostInviteInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) throw new Error('Invalid invitation details');
  const { eventId, email } = parsed.data;
  await requireEventAccess(eventId, user.id, 'owner');
  if (email === user.email.toLowerCase()) withMessage(`/dashboard/events/${eventId}`, 'You are already the host.');
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (!existing) withMessage(`/dashboard/events/${eventId}`, 'Ask the co-host to create a Saugaat account first.');
  const members = await db.eventMember.count({ where: { eventId } });
  if (members >= 10) withMessage(`/dashboard/events/${eventId}`, 'Maximum 10 co-hosts per event.');
  // A pending invitation conveys no privileges. Only the target account can accept.
  await db.eventInvite.upsert({
    where: { eventId_email: { eventId, email } },
    create: { eventId, email, invitedById: user.id },
    update: { invitedById: user.id },
  });
  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}?success=invite`);
}

export async function acceptCohostInviteAction(form: FormData) {
  const user = await requireUser();
  const invitationId = String(form.get('invitationId') || '');
  const invitation = await db.eventInvite.findUnique({ where: { id: invitationId }, include: { event: { select: { ownerId: true } } } });
  if (!invitation || invitation.email !== user.email.toLowerCase()) throw new Error('Invitation unavailable');
  if (invitation.event.ownerId === user.id) throw new Error('Owner cannot become a co-host');
  await db.$transaction(async tx => {
    const count = await tx.eventMember.count({ where: { eventId: invitation.eventId } });
    if (count >= 10) throw new Error('Event is at the maximum number of co-hosts');
    await tx.eventMember.upsert({
      where: { eventId_userId: { eventId: invitation.eventId, userId: user.id } },
      create: { eventId: invitation.eventId, userId: user.id, role: 'COHOST' },
      update: { role: 'COHOST' },
    });
    await tx.eventInvite.delete({ where: { id: invitation.id } });
  }, { isolationLevel: 'Serializable' });
  revalidatePath('/dashboard');
  redirect(`/dashboard/events/${invitation.eventId}`);
}

export async function revokeCohostAction(form: FormData) {
  const owner = await requireUser();
  const eventId = String(form.get('eventId') || '');
  const memberId = String(form.get('memberId') || '');
  await requireEventAccess(eventId, owner.id, 'owner');
  await db.eventMember.deleteMany({ where: { id: memberId, eventId } });
  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}`);
}

export async function withdrawCohostInviteAction(form: FormData) {
  const owner = await requireUser();
  const eventId = String(form.get('eventId') || '');
  const invitationId = String(form.get('invitationId') || '');
  await requireEventAccess(eventId, owner.id, 'owner');
  await db.eventInvite.deleteMany({ where: { id: invitationId, eventId } });
  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}`);
}

/** Enforce inventory conservation while updating quantity. */
export async function updateGiftSettingsAction(form: FormData) {
  const user = await requireUser();
  const parsed = giftSettingsInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) throw new Error('Invalid gift settings');
  const { giftId, eventId, title, quantity, category, priority } = parsed.data;
  await requireEventAccess(eventId, user.id, 'edit');
  await db.$transaction(async tx => {
    const gift = await tx.gift.findFirst({ where: { id: giftId, eventId }, select: { id: true } });
    if (!gift) throw new Error('Gift not found');
    const taken = await tx.reservation.count({ where: { giftId, status: { in: ['RESERVED', 'PURCHASED'] } } });
    if (quantity < taken) throw new Error('Quantity cannot be smaller than active reservations');
    await tx.gift.update({ where: { id: giftId }, data: { title, quantity, priority, category: category || null } });
  }, { isolationLevel: 'Serializable' });
  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}`);
}

/** Host or co-host records purchase status, never a payment claim. */
export async function setReservationPurchaseStatusAction(form: FormData) {
  const user = await requireUser();
  const reservationId = String(form.get('reservationId') || '');
  const eventId = String(form.get('eventId') || '');
  const next = String(form.get('nextStatus') || '');
  if (next !== 'PURCHASED' && next !== 'RESERVED') throw new Error('Invalid status change');
  await requireEventAccess(eventId, user.id, 'edit');
  await db.reservation.updateMany({
    where: { id: reservationId, eventId, status: next === 'PURCHASED' ? 'RESERVED' : 'PURCHASED' },
    data: { status: next },
  });
  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}`);
}
