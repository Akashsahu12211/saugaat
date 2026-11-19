import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function src(path) { return readFileSync(new URL('../' + path, import.meta.url), 'utf8'); }

test('media upload API fails closed until an explicit opt-in', () => {
  const route = src('src/app/api/memories/upload-intent/route.ts');
  assert.match(route, /PRIVATE_MEDIA_UPLOADS_ENABLED !== 'true'/);
  assert.match(route, /status: 503/);
  assert.match(route, /Cache-Control': 'no-store'/);
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
