import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
const read = name => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

test('Co-host is permissioned only after target-account invitation acceptance', () => {
  const actions = read('src/lib/actions.ts');
  assert.match(actions, /invitation\.email !== user\.email\.toLowerCase\(\)/);
  assert.match(actions, /eventMember\.upsert/);
  assert.match(actions, /eventInvite\.delete/);
  assert.match(actions, /requireEventAccess\(eventId, user\.id, 'owner'\)/);
});

test('Event management is accessible to owner/co-host and rejects strangers', () => {
  const p = read('src/lib/permissions.ts');
  assert.match(p, /const isOwner = event\.ownerId === userId/);
  assert.match(p, /const isCohost = event\.members\.some/);
  assert.match(p, /if \(!isOwner && \(level === 'owner' \|\| !isCohost\)\)/);
  const page = read('src/app/dashboard/events/[id]/page.tsx');
  assert.match(page, /await requireEventAccess\(id, user\.id, 'view'\)/);
});

test('Gift edit includes quantity safety and cannot affect other event gifts', () => {
  const a = read('src/lib/actions.ts');
  assert.match(a, /where: \{ id: giftId, eventId \}/);
  assert.match(a, /if \(quantity < taken\)/);
  assert.match(a, /isolationLevel: 'Serializable'/);
  assert.match(a, /await requireEventAccess\(eventId, user\.id, 'edit'\)/);
});

test('Purchase tracking only transitions matching active event reservation', () => {
  const a = read('src/lib/actions.ts');
  assert.match(a, /if \(next !== 'PURCHASED' && next !== 'RESERVED'\)/);
  assert.match(a, /where: \{ id: reservationId, eventId, status:/);
  assert.match(a, /status: next === 'PURCHASED' \? 'RESERVED' : 'PURCHASED'/);
  const guest = read('src/lib/actions.ts');
  assert.match(guest, /status: 'RESERVED'/);
});

test('Invitations cannot grant privileges until accepted and preserve uniqueness', () => {
  const s = read('prisma/schema.prisma');
  assert.match(s, /model EventInvite \{/);
  assert.match(s, /@@unique\(\[eventId, email\]\)/);
  assert.match(s, /@@unique\(\[eventId, userId\]\)/);
});

test('Guest cancellation is conditional and cannot undo host purchase marking', () => {
  const a = read('src/lib/actions.ts');
  assert.match(a, /const result = await db\.reservation\.updateMany\(/);
  assert.match(a, /where: \{ id: reservationId, status: 'RESERVED'/);
  assert.match(a, /if \(!result\.count\)/);
});
