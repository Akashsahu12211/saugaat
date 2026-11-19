import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function src(path) { return readFileSync(new URL('../' + path, import.meta.url), 'utf8'); }

test('media upload API fails closed until an explicit opt-in', () => {
  const route = src('src/app/api/memories/upload-intent/route.ts');
  assert.match(route, /PRIVATE_MEDIA_UPLOADS_ENABLED !== 'true'/);
  assert.match(route, /status: 503/);
  assert.match(route, /Cache-Control': 'no-store'/);
  const finish = src('src/app/api/memories/complete/route.ts');
  assert.match(finish, /PRIVATE_MEDIA_UPLOADS_ENABLED !== 'true'/);
  assert.match(finish, /status: 503/);
});

test('guest and host pages do not expose upload UI unless explicitly enabled', () => {
  for (const path of ['src/app/e/[slug]/page.tsx', 'src/app/dashboard/events/[id]/page.tsx']) {
    assert.match(src(path), /PRIVATE_MEDIA_UPLOADS_ENABLED === 'true'/);
  }
});

test('default config disables uploads separately from required private storage', () => {
  const config = src('.env.example');
  assert.match(config, /^PRIVATE_MEDIA_UPLOADS_ENABLED=false$/m);
  assert.match(config, /^PAYMENTS_MODE=disabled$/m);
  assert.match(config, /^REQUIRE_PRIVATE_MEDIA_STORAGE=false$/m);
});

test('private storage uses signed PUT and checks completed object metadata', () => {
  const storage = src('src/lib/memory-storage.ts');
  const uploader = src('src/components/memory-uploader.tsx');
  const intent = src('src/app/api/memories/upload-intent/route.ts');
  assert.match(storage, /new PutObjectCommand/);
  assert.match(storage, /expiresIn: 300/);
  assert.match(storage, /ContentLength: expectedBytes/);
  assert.match(storage, /head.ContentLength === expectedSize/);
  assert.doesNotMatch(storage, /createPresignedPost/);
  assert.match(uploader, /method: 'PUT'/);
  assert.doesNotMatch(uploader, /multipart\.append/);
  assert.match(intent, /signUpload\(key, mimeType, sizeBytes\)/);
});
