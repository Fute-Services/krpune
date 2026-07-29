import { test, expect } from '@playwright/test';
import {
  ROUTES,
  url,
  login,
  clearEverything,
  cacheEntryCount,
  serviceWorkerCount,
  CREDENTIALS,
} from './helpers';

/**
 * The gate: a logged-out visitor gets the login page off the network and leaves
 * nothing behind. No service worker, no cache, no install affordance.
 */
test.describe('auth gate', () => {
  test.beforeEach(async ({ context, page }) => {
    await clearEverything(context, page);
  });

  test('every protected route redirects to /login when signed out', async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(url(route.path));
      await expect(page, `${route.name} (${route.path}) should redirect`).toHaveURL(/#\/login/);
    }
  });

  test('signed out: nothing is registered and nothing is cached', async ({ page }) => {
    await page.goto(url('/vr'));
    await expect(page).toHaveURL(/#\/login/);
    // Give any stray startup registration a chance to happen before asserting.
    await page.waitForTimeout(3000);

    expect(await serviceWorkerCount(page), 'a service worker was registered while signed out').toBe(
      0,
    );
    expect(await cacheEntryCount(page), 'something was cached while signed out').toBe(0);
  });

  test('signed out: no install button and no offline UI', async ({ page }) => {
    await page.goto(url('/login'));
    await expect(page.getByRole('button', { name: /install app/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /offline status/i })).toHaveCount(0);
    await expect(page.getByText(/add to home screen/i)).toHaveCount(0);
  });

  test('wrong credentials show an inline error and do not sign in', async ({ page }) => {
    await page.goto(url('/login'));
    await page.fill('#email', 'wrong@example.com');
    await page.fill('#password', 'nope');
    await page.click('button[type="submit"]');

    await expect(page.getByRole('alert')).toContainText(/incorrect email or password/i);
    await expect(page).toHaveURL(/#\/login/);
    expect(await serviceWorkerCount(page)).toBe(0);
    expect(await cacheEntryCount(page)).toBe(0);
  });

  test('password show/hide toggle switches the input type', async ({ page }) => {
    await page.goto(url('/login'));
    const field = page.locator('#password');
    await expect(field).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: /show password/i }).click();
    await expect(field).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: /hide password/i }).click();
    await expect(field).toHaveAttribute('type', 'password');
  });

  test('a deep link survives the redirect through login', async ({ page }) => {
    await page.goto(url('/amenities'));
    await expect(page).toHaveURL(/#\/login/);

    await page.fill('#email', CREDENTIALS.email);
    await page.fill('#password', CREDENTIALS.password);
    await page.click('button[type="submit"]');

    // Back to where the user was actually going, not the home page.
    await expect(page).toHaveURL(/#\/amenities/);
  });

  test('opening /login while signed in goes straight into the app', async ({ page }) => {
    await login(page);
    await page.goto(url('/login'));
    await expect(page).not.toHaveURL(/#\/login/);
  });

  test('signing in registers the worker without a reload', async ({ page }) => {
    await page.goto(url('/login'));
    expect(await serviceWorkerCount(page)).toBe(0);

    await page.fill('#email', CREDENTIALS.email);
    await page.fill('#password', CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await expect(page).not.toHaveURL(/#\/login/);

    // No page.reload() here on purpose — this is the "reactive auth" claim.
    await expect
      .poll(() => serviceWorkerCount(page), {
        message: 'no service worker appeared after sign-in without a reload',
        timeout: 30_000,
      })
      .toBeGreaterThan(0);
  });

  test('signing out in one tab locks the other tab out', async ({ context, page }) => {
    await login(page);
    const second = await context.newPage();
    await second.goto(url('/'));
    await expect(second).not.toHaveURL(/#\/login/);

    // Sign out from the first tab; the second must follow via the storage event.
    await page.evaluate(() => window.localStorage.removeItem('krc.auth.session'));
    await page.evaluate(() =>
      window.dispatchEvent(new StorageEvent('storage', { key: 'krc.auth.session', newValue: null })),
    );

    await second.evaluate(() =>
      window.dispatchEvent(new StorageEvent('storage', { key: 'krc.auth.session', newValue: null })),
    );
    await expect(second).toHaveURL(/#\/login/, { timeout: 15_000 });
    await second.close();
  });
});
