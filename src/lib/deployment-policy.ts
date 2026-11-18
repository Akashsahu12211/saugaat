/** Pure config checks: safe to run before the web server accepts traffic. */
export type RuntimeEnvironment = Record<string, string | undefined>;
export type DeploymentIssue = { key: string; reason: string };

export function validateDeploymentConfiguration(env: RuntimeEnvironment, production = false): DeploymentIssue[] {
  const issues: DeploymentIssue[] = [];
  const reject = (key: string, reason: string) => issues.push({ key, reason });
  const db = env.DATABASE_URL?.trim();
  if (!db) reject('DATABASE_URL', 'Database URL is required');
  else {
    try {
      const u = new URL(db);
      if (!['postgresql:', 'postgres:'].includes(u.protocol) || !u.hostname || !u.pathname.replace(/\//g, '')) {
        reject('DATABASE_URL', 'Use a PostgreSQL connection URL with database name');
      }
      if (production && (u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.password === 'saugaat')) {
        reject('DATABASE_URL', 'Production may not use example local database settings');
      }
    } catch { reject('DATABASE_URL', 'Malformed PostgreSQL URL'); }
  }
  const secret = env.SESSION_SECRET || '';
  if (secret.length < 32 || /REPLACE|EXAMPLE|CHANGEME|test-secret|sample-secret/i.test(secret)) {
    reject('SESSION_SECRET', 'Use a strong randomly generated secret with at least 32 characters');
  }
  const site = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!site) reject('NEXT_PUBLIC_SITE_URL', 'Site origin is required');
  else {
    try {
      const u = new URL(site);
      if (u.username || u.password || u.pathname !== '/' || u.search || u.hash) reject('NEXT_PUBLIC_SITE_URL', 'Provide an origin only (no path, query or credentials)');
      if (production && (u.protocol !== 'https:' || ['localhost','127.0.0.1'].includes(u.hostname))) reject('NEXT_PUBLIC_SITE_URL', 'Production must use a public HTTPS origin');
      if (!production && !['http:','https:'].includes(u.protocol)) reject('NEXT_PUBLIC_SITE_URL', 'Unsupported protocol');
    } catch { reject('NEXT_PUBLIC_SITE_URL', 'Malformed site origin'); }
  }
  const mode = env.PAYMENTS_MODE || 'disabled';
  if (!['disabled', 'test'].includes(mode)) reject('PAYMENTS_MODE', 'Only disabled or test mode is implemented');
  if (production && mode !== 'disabled') reject('PAYMENTS_MODE', 'Live deployments must keep payment processing disabled until approved and verified');
  const storageKeys = ['S3_BUCKET','S3_ACCESS_KEY_ID','S3_SECRET_ACCESS_KEY'];
  const configured = storageKeys.filter(k => Boolean(env[k]));
  if (configured.length && configured.length !== storageKeys.length) reject('S3_STORAGE', 'Specify all required private-storage credentials together');
  if (production && env.REQUIRE_PRIVATE_MEDIA_STORAGE === 'true' && configured.length !== storageKeys.length) {
    reject('S3_STORAGE', 'Private media storage required for this launch');
  }
  if (production && env.S3_ENDPOINT) {
    try {
      if (new URL(env.S3_ENDPOINT).protocol !== 'https:') reject('S3_ENDPOINT', 'Production storage endpoint must use HTTPS');
    } catch { reject('S3_ENDPOINT', 'Malformed storage endpoint'); }
  }
  return issues;
}
