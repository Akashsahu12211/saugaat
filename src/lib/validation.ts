import { z } from 'zod';
export const credentials = z.object({
  email: z.email().max(200).transform(v => v.trim().toLowerCase()),
  password: z.string().min(10).max(120),
});
export const signup = credentials.extend({ name: z.string().trim().min(2).max(80) });
export const eventInput = z.object({
  title: z.string().trim().min(3).max(120),
  occasion: z.enum(['Wedding','Engagement','Birthday','Baby Shower','Housewarming','Anniversary','Naamkaran','Graduation','Retirement','Other']),
  date: z.iso.date(),
  location: z.string().trim().max(120).optional(),
  description: z.string().trim().max(1500).optional(),
});
export const giftInput = z.object({
  eventId: z.string().min(1),
  title: z.string().trim().min(2).max(160),
  url: z.union([z.url({ protocol: /^https?$/ }), z.literal('')]).optional(),
  price: z.union([z.string(), z.undefined()]),
});

export const rsvpInput = z.object({
  eventSlug: z.string().min(1).max(100),
  name: z.string().trim().min(2).max(80),
  rsvp: z.enum(['ATTENDING','DECLINED']),
  partySize: z.coerce.number().int().min(1).max(10),
});

/** Only existing Saugaat users may accept co-host access in this milestone. */
export const cohostInviteInput = z.object({
  eventId: z.string().cuid(),
  email: z.email().max(200).transform(value => value.trim().toLowerCase()),
});
export const giftSettingsInput = z.object({
  giftId: z.string().cuid(),
  eventId: z.string().cuid(),
  title: z.string().trim().min(2).max(160),
  quantity: z.coerce.number().int().min(1).max(20),
  priority: z.coerce.number().int().min(1).max(3),
  category: z.string().trim().max(70).optional(),
});
