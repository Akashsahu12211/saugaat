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

test('new host can sign up and create a private draft event', async ({ page }) => {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const hostName = 'Saugaat Test Host';
  const eventTitle = `Smoke Test Celebration ${unique}`;

  await page.goto('/signup');
  await page.getByLabel('Your name').fill(hostName);
  await page.getByLabel('Email').fill(`saugaat-e2e-${unique}@example.test`);
  await page.getByLabel('Password (10+ characters)').fill(`SaugaatTesting!${unique}`);
  await page.getByRole('button', { name: /Create account/i }).click();
  await expect(page).toHaveURL(/\\/dashboard(?:\\?|$)/);
  await expect(page.getByRole('heading', { name: /Namaste, Saugaat Test Host/i })).toBeVisible();

  await page.getByRole('link', { name: /Create Event/i }).first().click();
  await expect(page).toHaveURL(/\\/events\\/new/);
  await page.getByLabel('Occasion').selectOption('Birthday');
  await page.getByLabel('Event name').fill(eventTitle);
  await page.getByLabel('Event date').fill('2027-06-01');
  await page.getByLabel('City or venue (optional)').fill('Delhi');
  await page.getByRole('button', { name: /Create Event/i }).click();

  await expect(page).toHaveURL(/\\/dashboard\\/events\\/[a-z0-9]+(?:\\?|$)/);
  await expect(page.getByRole('heading', { name: eventTitle })).toBeVisible();
  await expect(page.getByText(/DRAFT/).first()).toBeVisible();
});
