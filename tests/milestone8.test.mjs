import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateDeploymentConfiguration } from '../src/lib/deployment-policy.ts';
const read = path => readFileSync(new URL('../'+path, import.meta.url),'utf8');
const safe = {
  DATABASE_URL: 'postgresql://saugaat:strongdevpassword@localhost:5432/saugaat',
  SESSION_SECRET: 'a-very-long-cryptographically-random-looking-session-secret-for-tests',
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', PAYMENTS_MODE: 'disabled',
};
const prod = { ...safe, DATABASE_URL:'postgresql://prod:strongpassword@db.example.com:5432/saugaat?sslmode=require', NEXT_PUBLIC_SITE_URL:'https://saugaat.example.com' };
test('development configuration accepts safe defaults', () => assert.deepEqual(validateDeploymentConfiguration(safe), []));
test('production configuration accepts secure HTTPS origin with disabled payments', () => assert.deepEqual(validateDeploymentConfiguration(prod, true), []));
test('missing or placeholder secrets cannot pass production preflight', () => assert.ok(validateDeploymentConfiguration({ ...prod, SESSION_SECRET: 'REPLACE_WITH_RANDOM_LONG_SECRET_AT_LEAST_32_CHARACTERS' }, true).some(e => e.key === 'SESSION_SECRET')));
test('production refuses localhost site and insecure example database password', () => {
  const errs = validateDeploymentConfiguration(safe, true);
  assert.ok(errs.some(e => e.key === 'NEXT_PUBLIC_SITE_URL'));
  assert.ok(errs.some(e => e.key === 'DATABASE_URL'));
});
test('no real-money live payment mode exists', () => {
  assert.ok(validateDeploymentConfiguration({ ...prod, PAYMENTS_MODE:'live' }, true).some(e => e.key === 'PAYMENTS_MODE'));
  assert.ok(validateDeploymentConfiguration({ ...prod, PAYMENTS_MODE:'test' }, true).some(e => e.key === 'PAYMENTS_MODE'));
});
test('incomplete private-storage credentials fail validation', () => assert.ok(validateDeploymentConfiguration({ ...prod, S3_BUCKET:'private' }, true).some(e => e.key === 'S3_STORAGE')));
test('strict mode may require configured private media storage', () => assert.ok(validateDeploymentConfiguration({ ...prod, REQUIRE_PRIVATE_MEDIA_STORAGE:'true' }, true).some(e => e.key === 'S3_STORAGE')));
test('public health endpoint is no-store with readiness backed by PostgreSQL', () => {
  const live=read('src/app/api/health/live/route.ts'), ready=read('src/app/api/health/ready/route.ts');
  assert.match(live,/Cache-Control.*no-store/);
  assert.match(ready,/db\.\$queryRaw/);
  assert.match(ready,/503/);
  assert.doesNotMatch(ready,/String\(err\)|error\.message|console\.error/);
});
test('browser E2E coverage exists for login, admin, and mobile overflow', () => {
  const tests=read('e2e/public-smoke.spec.ts');
  assert.match(tests,/admin console requires login/);
  assert.match(tests,/horizontal overflow/);
  assert.match(tests,/login is accessible/);
});
test('preflight script has no secret value output', () => {
  const script=read('scripts/preflight.mjs');
  assert.doesNotMatch(script,/console\.(?:log|error)\(.*SESSION_SECRET.*process\.env/);
  assert.match(script,/validateDeploymentConfiguration/);
});
