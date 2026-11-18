import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const read = name => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

test('Schema supports anonymous gift reservations without requiring a user account', () => {
  const schema = read('prisma/schema.prisma');
  assert.match(schema, /guestUserId\s+String\?/);
  assert.match(schema, /visitorId\s+String\?/);
  assert.match(schema, /@@index\(\[giftId, visitorId, status\]\)/);
});

test('RSVP uses unique per-browser identity and an attendance enum', () => {
  const schema = read('prisma/schema.prisma');
  assert.match(schema, /enum RSVPStatus/);
  assert.match(schema, /@@unique\(\[eventId, visitorId\]\)/);
  assert.match(schema, /partySize\s+Int/);
});

test('Reservations use serializable transactions and retry known serialization conflicts', () => {
  const actions = read('src/lib/actions.ts');
  assert.match(actions, /isolationLevel:\s*'Serializable'/);
  assert.match(actions, /err\.code === 'P2034'/);
  assert.match(actions, /taken >= gift\.quantity/);
});

test('Guest identity cookie is signed, HttpOnly, and SameSite lax', () => {
  const guest = read('src/lib/guest.ts');
  assert.match(guest, /jwtVerify/);
  assert.match(guest, /httpOnly:\s*true/);
  assert.match(guest, /sameSite:\s*'lax'/);
});
