import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const schema = source('prisma/schema.prisma');
const storage = source('src/lib/memory-storage.ts');
const invite = source('src/lib/invitations.ts');
const intent = source('src/app/api/memories/upload-intent/route.ts');
const complete = source('src/app/api/memories/complete/route.ts');
const view = source('src/app/api/memories/[id]/view/route.ts');
const moderation = source('src/lib/memory-actions.ts');
const ui = source('src/components/memory-uploader.tsx');

test('Media records allow anonymous guest uploads without forced signup', () => {
  assert.match(schema,/uploaderId String\?/);
  assert.match(schema,/visitorId String\?/);
  assert.match(schema,/uploadedAt DateTime\?/);
  assert.match(schema,/uploadExpiresAt DateTime/);
  assert.match(schema,/status\s+MediaStatus @default\(PENDING\)/);
});
test('Guest invitation has separate private gallery permissions defaulting to false', () => {
  assert.match(schema,/allowMediaView Boolean @default\(false\)/);
  assert.match(schema,/allowMediaUpload Boolean @default\(false\)/);
  assert.match(invite,/action === 'view' \? link.allowMediaView : link.allowMediaUpload/);
  assert.match(invite,/revokedAt: null, expiresAt: \{ gt: new Date\(\) \}/);
});
test('Uploads are private, short-lived, content type constrained, and size checked', () => {
  assert.match(storage,/PutObjectCommand/);
  assert.match(storage,/expiresIn: 300/);
  assert.match(storage,/ContentLength: expectedBytes/);
  assert.match(storage,/head.ContentLength === expectedSize/);
  assert.match(storage,/image\/jpeg/);
  assert.match(storage,/video\/mp4/);
  assert.doesNotMatch(storage,/ACL:\s*'public-read'/);
  assert.match(intent,/memoryAccess\(eventId, 'upload'\)/);
  assert.match(intent,/randomUUID\(\)/);
  assert.match(intent,/pending >= 10/);
});
test('Upload completion validates private object metadata before approval', () => {
  assert.match(complete,/validateObject\(media.storageKey, media.mimeType, media.sizeBytes\)/);
  assert.match(complete,/media.uploadExpiresAt <= new Date\(\)/);
  assert.match(complete,/status: 403/);
  assert.match(storage,/HeadObjectCommand/);
});
test('Unapproved media is not returned to guests even with gallery access', () => {
  assert.match(view,/media.status !== 'APPROVED'/);
  assert.match(view,/memoryAccess\(media.eventId, 'view'\)/);
  assert.match(view,/Cache-Control': 'private, no-store/);
  assert.match(storage,/expiresIn: 60/);
  assert.match(storage,/ResponseContentDisposition:/);
});
test('Host-only approval and deletion including object cleanup', () => {
  assert.match(moderation,/requireEventAccess\(eventId, user.id, 'owner'\)/);
  assert.match(moderation,/status: 'PENDING', uploadedAt: \{ not: null \}/);
  assert.match(moderation,/deleteObject\(media.storageKey\)/);
});
test('Browser uploads directly, preserving private server credentials', () => {
  assert.match(ui,/fetch\(plan.upload.url/);
  assert.match(ui,/method: 'PUT'/);
  assert.match(ui,/body: file/);
  assert.match(ui,/host must approve/i);
  assert.doesNotMatch(ui,/S3_ACCESS_KEY_ID/);
});
