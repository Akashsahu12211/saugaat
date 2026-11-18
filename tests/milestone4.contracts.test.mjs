import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('Invite bearer tokens are random, stored only as hashes, and revocable', () => {
  const code = read('src/lib/invitations.ts');
  const schema = read('prisma/schema.prisma');
  assert.match(code, /randomBytes\(32\)/);
  assert.match(code, /createHash\('sha256'\)/);
  assert.match(schema, /tokenHash\s+String\s+@unique/);
  assert.match(schema, /revokedAt\s+DateTime\?/);
  assert.match(schema, /expiresAt\s+DateTime/);
});

test('Guest reads, gift reservation, cancellation, RSVP enforce invitation gate', () => {
  const page = read('src/app/e/[slug]/page.tsx');
  const actions = read('src/lib/actions.ts');
  assert.match(page, /canAccessEvent\(event\)/);
  assert.ok((actions.match(/canAccessEvent\(/g) || []).length >= 3);
});

test('Invitation redemption uses serializable transactions and capped redemption', () => {
  const code = read('src/app/invite/[token]/route.ts');
  assert.match(code, /isolationLevel: 'Serializable'/);
  assert.match(code, /found\.maxUses !== null && found\.useCount >= found\.maxUses/);
  assert.match(code, /found\.revokedAt/);
  assert.match(code, /Referrer-Policy/);
});

test('Guest event cookie is signed, scoped and revocable on every visit', () => {
  const code = read('src/lib/invitations.ts');
  assert.match(code, /jwtVerify/);
  assert.match(code, /httpOnly: true/);
  assert.match(code, /sameSite: 'lax'/);
  assert.match(code, /invitationLink\.findFirst/);
});

test('Consent preferences default to off and never imply delivery', () => {
  const code = read('src/lib/invitation-actions.ts');
  const schema = read('prisma/schema.prisma');
  assert.match(code, /whatsappUpdates/);
  assert.match(schema, /whatsappUpdates Boolean @default\(false\)/);
});

test('QR code is generated locally and WhatsApp sharing is user initiated', () => {
  const image = read('src/components/invitation-display.tsx');
  const share = read('src/components/share-link.tsx');
  assert.match(image, /QRCode\.toDataURL/);
  assert.match(share, /https:\/\/wa\.me\/\?text=/);
  assert.match(share, /onClick=\{whatsapp\}/);
});
