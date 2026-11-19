import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('authentication actions must enforce shared throttles before user lookups', () => {
  const actions = src('src/lib/actions.ts');
  const limit = src('src/lib/auth-throttle.ts');
  const registration = actions.indexOf("allowAuthAttempt('signup', email)");
  const login = actions.indexOf("allowAuthAttempt('login', parsed.data.email)");
  const registeredUserLookup = actions.indexOf('if (await db.user.findUnique');
  const loginLookup = actions.indexOf('const user = await db.user.findUnique');
  assert.ok(registration >= 0 && registration < registeredUserLookup, 'signup is limited before lookup');
  assert.ok(login >= 0 && login < loginLookup, 'login is limited before lookup');
  assert.match(limit, /createHmac\('sha256', secret\)/);
  assert.match(limit, /ON CONFLICT \("id"\) DO UPDATE/);
  assert.match(limit, /RETURNING "attempts"/);
  assert.match(limit, /15 \* 60/);
  assert.doesNotMatch(limit, /new Map\(/);
});

test('versioned throttle migration is additive and indexed', () => {
  const migration = src('prisma/migrations/20261119_auth_throttle/migration.sql');
  assert.match(migration, /CREATE TABLE "AuthThrottle"/);
  assert.match(migration, /CREATE INDEX "AuthThrottle_resetAt_idx"/);
  assert.doesNotMatch(migration, /\b(?:DROP|TRUNCATE)\b/i);
  assert.match(src('prisma/schema.prisma'), /model AuthThrottle \{/);
});

test('Postgres authentication throttle increments atomically under concurrent attempts', { skip: !process.env.DATABASE_URL }, async () => {
  const { Client } = await import('pg');
  const key = 'ci_auth_throttle_' + Math.random().toString(36).slice(2);
  const workers = Array.from({ length: 12 }, () => new Client({ connectionString: process.env.DATABASE_URL }));
  try {
    await Promise.all(workers.map(c => c.connect()));
    const responses = await Promise.all(workers.map(c => c.query(`
      INSERT INTO "AuthThrottle" ("id", "attempts", "resetAt")
      VALUES ($1, 1, NOW() + (900 * INTERVAL '1 second'))
      ON CONFLICT ("id") DO UPDATE SET
        "attempts" = CASE WHEN "AuthThrottle"."resetAt" <= NOW() THEN 1 ELSE "AuthThrottle"."attempts" + 1 END,
        "resetAt" = CASE WHEN "AuthThrottle"."resetAt" <= NOW() THEN NOW() + (900 * INTERVAL '1 second') ELSE "AuthThrottle"."resetAt" END
      RETURNING "attempts"
    `, [key])));
    assert.deepEqual(responses.map(x => x.rows[0].attempts).sort((a, b) => a - b), Array.from({length:12}, (_,i)=>i+1));
    const history = await workers[0].query('SELECT attempts FROM "AuthThrottle" WHERE "id" = $1', [key]);
    assert.equal(history.rows[0].attempts, 12);
  } finally {
    await Promise.all(workers.map(c => c.end().catch(() => {})));
    const cleanup = new Client({ connectionString: process.env.DATABASE_URL });
    try { await cleanup.connect(); await cleanup.query('DELETE FROM "AuthThrottle" WHERE "id" = $1', [key]); }
    finally { await cleanup.end().catch(() => {}); }
  }
});
