import 'server-only';
import { db } from '@/lib/db';
import { canAccessEvent } from '@/lib/invitations';
import { guestIdentity, persistGuestIdentity } from '@/lib/guest';
import { getUser } from '@/lib/auth';
import { requireEventAccess } from '@/lib/permissions';

export function rupeesToPaise(raw: string): number {
  if (!/^(?:[1-9]\d{0,6})(?:\.\d{1,2})?$/.test(raw.trim())) throw new Error('Enter ₹1–₹99,99,999.99');
  const [whole, part = ''] = raw.trim().split('.');
  const amount = Number(whole) * 100 + Number(part.padEnd(2, '0'));
  if (!Number.isSafeInteger(amount) || amount < 100 || amount > 999999999) throw new Error('Invalid contribution amount');
  return amount;
}
export function contributionTotals(items: { amountPaise: number; status: string }[]) {
  return {
    pledgedPaise: items.filter(c => c.status === 'PLEDGED').reduce((n,c) => n + c.amountPaise, 0),
    paidPaise: items.filter(c => c.status === 'PAID' || c.status === 'REFUND_PENDING').reduce((n,c) => n + c.amountPaise, 0),
  };
}
export async function openGiftFund(eventId: string, giftId: string, userId: string) {
  await requireEventAccess(eventId, userId, 'owner');
  const gift = await db.gift.findFirst({ where: { id: giftId, eventId }, select: { pricePaise: true } });
  if (!gift?.pricePaise || gift.pricePaise < 100) throw new Error('Set a valid gift price first');
  return db.giftFund.upsert({ where: { giftId }, create: { eventId, giftId, targetPaise: gift.pricePaise }, update: {} });
}
export async function createPledge(fundId: string, amountPaise: number) {
  if (!Number.isInteger(amountPaise) || amountPaise < 100 || amountPaise > 999999999) throw new Error('Invalid pledge amount');
  const visitor = await guestIdentity();
  const user = await getUser();
  const fund = await db.giftFund.findUnique({ where: { id: fundId }, include: { event: true } });
  if (!fund || fund.status !== 'OPEN' || !(await canAccessEvent(fund.event))) throw new Error('Fund unavailable');
  if (fund.event.ownerId === user?.id) throw new Error('Hosts cannot pledge to their own fund');
  const pledge = await db.contribution.create({ data: { fundId, eventId: fund.eventId,
    visitorId: visitor.id, guestUserId: user?.id, amountPaise, status: 'PLEDGED' } });
  if (visitor.needsCookie) await persistGuestIdentity(visitor.id);
  return pledge;
}
export async function cancelPledge(contributionId: string) {
  const visitor = await guestIdentity(); const user = await getUser();
  const result = await db.contribution.updateMany({
    where: { id: contributionId, status: 'PLEDGED', OR: [{ visitorId: visitor.id }, ...(user ? [{guestUserId: user.id}] : [])] },
    data: { status: 'CANCELLED' },
  });
  if (!result.count) throw new Error('Pledge unavailable or already settled');
}
