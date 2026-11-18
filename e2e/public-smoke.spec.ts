import { test, expect } from '@playwright/test';
test('public homepage loads and offers a registry CTA', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Celebrate together/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Create your registry/i }).first()).toBeVisible();
});
test('guest information is accessible on a narrow viewport without horizontal overflow', async ({ page }) => {
  await page.goto('/');
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    width: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width + 2);
});
test('login is accessible and authenticated dashboards stay protected', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /Log in to Saugaat/i })).toBeVisible();
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
});
test('admin console requires login', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
});
test('health checks return only status and disable caching', async ({ request }) => {
  const live = await request.get('/api/health/live');
  const ready = await request.get('/api/health/ready');
  expect(live.status()).toBe(200);
  expect(await live.json()).toEqual({ status: 'alive' });
  expect(live.headers()['cache-control']).toContain('no-store');
  expect(ready.status()).toBe(200);
  expect(await ready.json()).toEqual({ status: 'ready' });
});
