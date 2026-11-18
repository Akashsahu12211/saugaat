'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { createPledge, cancelPledge, openGiftFund, rupeesToPaise } from '@/lib/group-gifting';

export async function openFundAction(form: FormData) {
  const user = await requireUser();
  const eventId = String(form.get('eventId') || '');
  const giftId = String(form.get('giftId') || '');
  await openGiftFund(eventId, giftId, user.id);
  revalidatePath('/dashboard/events/' + eventId);
  redirect('/dashboard/events/' + eventId + '#group-gifting');
}
export async function pledgeAction(form: FormData) {
  const fundId = String(form.get('fundId') || '');
  const amount = rupeesToPaise(String(form.get('amount') || ''));
  const result = await createPledge(fundId, amount);
  const fund = await db.giftFund.findUniqueOrThrow({ where: { id: result.fundId },
    select: { event: { select: { slug: true } } } });
  const route = '/e/' + fund.event.slug;
  revalidatePath(route);
  redirect(route + '?pledged=1#group-gifting');
}
export async function cancelPledgeAction(form: FormData) {
  const id = String(form.get('contributionId') || '');
  const eventSlug = String(form.get('eventSlug') || '');
  if (!/^[-a-z0-9]{1,110}$/.test(eventSlug)) throw new Error('Invalid event');
  await cancelPledge(id);
  revalidatePath('/e/' + eventSlug);
  redirect('/e/' + eventSlug + '#group-gifting');
}
