import { test } from '@playwright/test';
import { url, login } from './helpers';

/**
 * Not assertions — these exist so the login design can actually be looked at
 * rather than described. Written to test-results/screens/.
 */
test.describe('screens', () => {
  test('login at 1280x800 (iPad landscape)', async ({ page }) => {
    await page.goto(url('/login'));
    await page.waitForTimeout(1800); // let the entry animations settle
    await page.screenshot({ path: 'test-results/screens/login-desktop.png' });
  });

  test('login with an error shown', async ({ page }) => {
    await page.goto(url('/login'));
    await page.fill('#email', 'wrong@example.com');
    await page.fill('#password', 'nope');
    await page.click('button[type="submit"]');
    await page.getByRole('alert').waitFor();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'test-results/screens/login-error.png' });
  });

  test('login at 430x932 (phone — left panel becomes a faded background)', async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto(url('/login'));
    await page.waitForTimeout(1800);
    await page.screenshot({ path: 'test-results/screens/login-mobile.png' });
  });

  test('offline panel, signed in', async ({ page }) => {
    await login(page);
    await page.waitForTimeout(3000);
    await page.getByRole('button', { name: /offline status/i }).click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'test-results/screens/offline-panel.png' });
  });
});
